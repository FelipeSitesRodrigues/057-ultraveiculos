-- ============================================================
-- Ultra Veiculos (057) - schema inicial
-- ============================================================
-- Regras que este arquivo implementa, decididas em 2026-08-28:
--   1. RLS ligada em TODAS as tabelas, deny by default
--   2. veiculo_financeiro (custo e preco minimo) NUNCA e legivel pelo publico
--   3. Painel unico de administrador: quem tem perfil ativo ve tudo
--      (a coluna role ja existe para a fase 2 separar dono de vendedor)
--   4. Lead do site entra por funcao RPC validada, nao por insert direto
-- ============================================================

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------

-- Mantem atualizado_em sempre correto, sem depender do app lembrar.
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- perfis: quem pode entrar no painel
-- ------------------------------------------------------------
create table public.perfis (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null default '',
  role       text not null default 'admin' check (role in ('admin','vendedor')),
  ativo      boolean not null default true,
  criado_em  timestamptz not null default now()
);

alter table public.perfis enable row level security;

-- Cada um le a propria linha. Ninguem edita a propria role pelo cliente:
-- promover ou rebaixar usuario e feito no painel do Supabase, de proposito.
create policy "perfil proprio: ler"
  on public.perfis for select
  to authenticated
  using (id = (select auth.uid()));

-- Quem faz parte da equipe da loja: tem perfil e esta ativo.
-- security definer para conseguir ler public.perfis de dentro das policies
-- sem cair em recursao de RLS. search_path travado em vazio, entao tudo
-- aqui dentro precisa ser qualificado.
-- Precisa vir depois da tabela perfis: funcao em linguagem sql tem o corpo
-- validado no momento da criacao.
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = (select auth.uid())
      and p.ativo
  );
$$;

revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- ------------------------------------------------------------
-- vendedores: Adenilson e Solon, cada um com o proprio WhatsApp
-- ------------------------------------------------------------
create table public.vendedores (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  whatsapp      text not null,          -- so digitos, ex: 5511981404811
  ativo         boolean not null default true,
  ordem         int not null default 0,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint whatsapp_so_digitos check (whatsapp ~ '^[0-9]{10,15}$')
);

alter table public.vendedores enable row level security;

create policy "vendedores: publico le os ativos"
  on public.vendedores for select
  to anon, authenticated
  using (ativo);

create policy "vendedores: equipe gerencia"
  on public.vendedores for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create trigger vendedores_atualizado_em
  before update on public.vendedores
  for each row execute function public.tocar_atualizado_em();

-- ------------------------------------------------------------
-- veiculos: o estoque publico. NENHUM dado de custo mora aqui.
-- ------------------------------------------------------------
create table public.veiculos (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  status         text not null default 'rascunho'
                 check (status in ('rascunho','preparacao','publicado','vendido','arquivado')),
  destaque       boolean not null default false,   -- selo "oferta destaque"
  premium        boolean not null default false,   -- colecao Premium
  ordem          int not null default 0,

  marca          text not null default '',
  modelo         text not null default '',
  versao         text not null default '',
  ano_fabricacao int check (ano_fabricacao between 1900 and 2100),
  ano_modelo     int check (ano_modelo between 1900 and 2100),
  km             int check (km >= 0),
  preco_centavos bigint not null default 0 check (preco_centavos >= 0),
  cambio         text,
  combustivel    text,
  cor            text,
  portas         int check (portas between 2 and 6),
  carroceria     text,
  placa_final    int check (placa_final between 0 and 9),  -- so o digito, nunca a placa
  descricao      text not null default '',
  ficha          jsonb not null default '{}'::jsonb,
  opcionais      text[] not null default '{}',

  vendedor_id    uuid references public.vendedores(id) on delete set null,

  origem         text not null default 'manual' check (origem in ('manual','webmotors')),
  id_externo     text,                              -- preparado pra sync futura

  entrou_em      date not null default current_date, -- base do "dias no estoque"
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  criado_por     uuid references auth.users(id) on delete set null,

  busca tsvector generated always as (
    to_tsvector('portuguese',
      coalesce(marca,'') || ' ' || coalesce(modelo,'') || ' ' ||
      coalesce(versao,'') || ' ' || coalesce(cor,''))
  ) stored
);

alter table public.veiculos enable row level security;

-- O publico so enxerga o que esta publicado. Rascunho, preparacao, vendido
-- e arquivado ficam invisiveis fora do painel.
create policy "veiculos: publico le os publicados"
  on public.veiculos for select
  to anon, authenticated
  using (status = 'publicado');

create policy "veiculos: equipe gerencia"
  on public.veiculos for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create index veiculos_vitrine_idx on public.veiculos (status, destaque, ordem);
create index veiculos_marca_modelo_idx on public.veiculos (marca, modelo);
create index veiculos_preco_idx on public.veiculos (preco_centavos);
create index veiculos_ano_idx on public.veiculos (ano_modelo);
create index veiculos_entrou_em_idx on public.veiculos (entrou_em);
create index veiculos_busca_idx on public.veiculos using gin (busca);

create trigger veiculos_atualizado_em
  before update on public.veiculos
  for each row execute function public.tocar_atualizado_em();

-- ------------------------------------------------------------
-- veiculo_financeiro: custo e piso de preco.
-- TABELA SEPARADA DE PROPOSITO. Nenhuma policy para anon.
-- Um "select *" distraido no site publico nao tem como trazer o custo,
-- porque a coluna nao mora na tabela que o site le.
-- ------------------------------------------------------------
create table public.veiculo_financeiro (
  veiculo_id      uuid primary key references public.veiculos(id) on delete cascade,
  custo_centavos  bigint check (custo_centavos >= 0),
  minimo_centavos bigint check (minimo_centavos >= 0),
  atualizado_em   timestamptz not null default now(),
  atualizado_por  uuid references auth.users(id) on delete set null
);

alter table public.veiculo_financeiro enable row level security;

-- Uma unica policy, e ela exige sessao de equipe. anon nao tem nenhuma.
create policy "financeiro: so a equipe"
  on public.veiculo_financeiro for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Cinto e suspensorio: revoga o grant de tabela para anon.
-- Mesmo que alguem crie uma policy errada no futuro, anon nao chega aqui.
revoke all on public.veiculo_financeiro from anon;

create trigger financeiro_atualizado_em
  before update on public.veiculo_financeiro
  for each row execute function public.tocar_atualizado_em();

-- desconto_max e lucro NAO sao colunas: sao calculados na hora, pra nunca
-- desincronizar do preco.
--   desconto_max = veiculos.preco_centavos - minimo_centavos
--   lucro        = veiculos.preco_centavos - custo_centavos

-- ------------------------------------------------------------
-- veiculo_fotos
-- ------------------------------------------------------------
create table public.veiculo_fotos (
  id         uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null references public.veiculos(id) on delete cascade,
  path       text not null,              -- caminho no bucket, nao URL crua
  ordem      int not null default 0,     -- ordem 0 e a capa
  largura    int,
  altura     int,
  alt        text not null default '',
  criado_em  timestamptz not null default now()
);

alter table public.veiculo_fotos enable row level security;

-- Foto so aparece se o veiculo dono dela estiver publicado.
create policy "fotos: publico le as de veiculo publicado"
  on public.veiculo_fotos for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.veiculos v
      where v.id = veiculo_id and v.status = 'publicado'
    )
  );

create policy "fotos: equipe gerencia"
  on public.veiculo_fotos for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create index veiculo_fotos_veiculo_idx on public.veiculo_fotos (veiculo_id, ordem);

-- ------------------------------------------------------------
-- banners do topo do catalogo
-- ------------------------------------------------------------
create table public.banners (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null default '',
  imagem_path   text not null,
  link          text,
  ativo         boolean not null default true,
  ordem         int not null default 0,
  inicia_em     timestamptz,
  termina_em    timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.banners enable row level security;

create policy "banners: publico le os no ar"
  on public.banners for select
  to anon, authenticated
  using (
    ativo
    and (inicia_em is null or inicia_em <= now())
    and (termina_em is null or termina_em >= now())
  );

create policy "banners: equipe gerencia"
  on public.banners for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create trigger banners_atualizado_em
  before update on public.banners
  for each row execute function public.tocar_atualizado_em();

-- ------------------------------------------------------------
-- leads: quem preencheu formulario no site
-- Ninguem de fora le. E ninguem de fora escreve direto: a escrita passa
-- pela funcao registrar_lead, que valida antes.
-- ------------------------------------------------------------
create table public.leads (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  telefone   text not null,
  mensagem   text not null default '',
  veiculo_id uuid references public.veiculos(id) on delete set null,
  origem     text not null default 'site'
             check (origem in ('site','veiculo','vender-meu-carro','financiamento')),
  atendido   boolean not null default false,
  ip_hash    text,                       -- hash, nunca o IP em claro
  user_agent text,
  criado_em  timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "leads: so a equipe"
  on public.leads for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

revoke all on public.leads from anon;

create index leads_criado_em_idx on public.leads (criado_em desc);

-- Porta unica de entrada de lead. Valida tamanho e formato antes de gravar,
-- e so deixa escrever nas colunas que ela mesma preenche.
create or replace function public.registrar_lead(
  p_nome       text,
  p_telefone   text,
  p_mensagem   text default '',
  p_veiculo_id uuid default null,
  p_origem     text default 'site',
  p_ip_hash    text default null,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_nome text := btrim(p_nome);
  v_tel  text := regexp_replace(coalesce(p_telefone,''), '[^0-9]', '', 'g');
begin
  if length(v_nome) < 2 or length(v_nome) > 120 then
    raise exception 'nome invalido';
  end if;

  if length(v_tel) < 10 or length(v_tel) > 15 then
    raise exception 'telefone invalido';
  end if;

  if length(coalesce(p_mensagem,'')) > 2000 then
    raise exception 'mensagem muito longa';
  end if;

  if p_origem not in ('site','veiculo','vender-meu-carro','financiamento') then
    raise exception 'origem invalida';
  end if;

  insert into public.leads (nome, telefone, mensagem, veiculo_id, origem, ip_hash, user_agent)
  values (
    v_nome,
    v_tel,
    left(btrim(coalesce(p_mensagem,'')), 2000),
    p_veiculo_id,
    p_origem,
    left(coalesce(p_ip_hash,''), 64),
    left(coalesce(p_user_agent,''), 300)
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.registrar_lead(text,text,text,uuid,text,text,text)
  to anon, authenticated;

-- ------------------------------------------------------------
-- config: taxa de juros, prazo, dados da loja
-- ------------------------------------------------------------
create table public.config (
  chave         text primary key,
  valor         jsonb not null,
  publica       boolean not null default false,
  atualizado_em timestamptz not null default now()
);

alter table public.config enable row level security;

-- So o que estiver marcado como publico sai pro site. Qualquer chave
-- sensivel que entrar no futuro fica fechada por padrao.
create policy "config: publico le so o que e publico"
  on public.config for select
  to anon, authenticated
  using (publica);

create policy "config: equipe gerencia"
  on public.config for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create trigger config_atualizado_em
  before update on public.config
  for each row execute function public.tocar_atualizado_em();

-- ------------------------------------------------------------
-- Storage: fotos de veiculo e banners
-- Leitura publica (sao fotos de anuncio), escrita so pela equipe.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('veiculos', 'veiculos', true, 10485760,
   array['image/jpeg','image/png','image/webp','image/avif']),
  ('banners',  'banners',  true, 10485760,
   array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

create policy "storage: leitura publica dos buckets do site"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('veiculos','banners'));

create policy "storage: equipe envia"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('veiculos','banners') and public.is_staff());

create policy "storage: equipe atualiza"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('veiculos','banners') and public.is_staff())
  with check (bucket_id in ('veiculos','banners') and public.is_staff());

create policy "storage: equipe apaga"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('veiculos','banners') and public.is_staff());
