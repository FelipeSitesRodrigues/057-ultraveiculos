-- ------------------------------------------------------------
-- Fotos de cliente gerenciadas pelo painel
-- ------------------------------------------------------------
-- Ate aqui as fotos do carrossel "Quem ja e da Ultra" moravam na pasta
-- public/img/clientes e so entravam por commit, com o espelho guardado numa
-- chave da config. Funcionou pra 11 fotos, mas o Pietro recebe cliente novo
-- toda semana e quer subir a foto ele mesmo, do celular.
--
-- Agora cada foto e uma linha, com o arquivo no bucket `clientes`. O espelho
-- continua sendo estado e nao edicao: o site aplica scaleX(-1) no CSS, entao
-- desfazer devolve a foto original e o logo da plaquinha nunca fica invertido
-- no arquivo.

create table public.fotos_clientes (
  id            uuid primary key default gen_random_uuid(),
  path          text not null,
  espelhada     boolean not null default false,
  ordem         int not null default 0,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index fotos_clientes_ordem_idx on public.fotos_clientes (ordem);

alter table public.fotos_clientes enable row level security;

-- Nao existe foto "fora do ar": quem nao quer mais a foto, remove.
create policy "fotos_clientes: publico le"
  on public.fotos_clientes for select
  to anon, authenticated
  using (true);

create policy "fotos_clientes: equipe gerencia"
  on public.fotos_clientes for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create trigger fotos_clientes_atualizado_em
  before update on public.fotos_clientes
  for each row execute function public.tocar_atualizado_em();

-- ------------------------------------------------------------
-- Bucket e policies do Storage
-- ------------------------------------------------------------
-- Foto de celular reduzida no navegador fica em 150 KB, entao 10 MB e folga.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('clientes', 'clientes', true, 10485760,
   array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

-- As policies do schema inicial listam os buckets por nome. Recriadas com o
-- bucket novo, mantendo a mesma regra: leitura publica, escrita so da equipe.
drop policy "storage: leitura publica dos buckets do site" on storage.objects;
drop policy "storage: equipe envia" on storage.objects;
drop policy "storage: equipe atualiza" on storage.objects;
drop policy "storage: equipe apaga" on storage.objects;

create policy "storage: leitura publica dos buckets do site"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('veiculos','banners','clientes'));

create policy "storage: equipe envia"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('veiculos','banners','clientes') and public.is_staff());

create policy "storage: equipe atualiza"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('veiculos','banners','clientes') and public.is_staff())
  with check (bucket_id in ('veiculos','banners','clientes') and public.is_staff());

create policy "storage: equipe apaga"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('veiculos','banners','clientes') and public.is_staff());

-- ------------------------------------------------------------
-- As 25 fotos que o Felipe separou em 2026-09-11
-- ------------------------------------------------------------
-- Os arquivos sobem pro bucket em `inicial/01.webp` ate `inicial/25.webp`,
-- na mesma ordem da pasta "CLIENTES QUE COMPRARAM CARRO (PARA O CARROSEL)".
-- So a 01 (BMW) nasce espelhada: e a unica que o Felipe ja tinha marcado no
-- painel e que continua na selecao nova. O resto o Pietro decide olhando.
insert into public.fotos_clientes (path, espelhada, ordem)
select
  'inicial/' || lpad(n::text, 2, '0') || '.webp',
  n = 1,
  n
from generate_series(1, 25) as n;

-- O espelho saiu da config e foi pra coluna `espelhada`.
delete from public.config where chave = 'fotos_clientes';
