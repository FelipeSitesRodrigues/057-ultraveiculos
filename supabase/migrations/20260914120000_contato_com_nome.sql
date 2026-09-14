-- ============================================================
-- Contato do site com nome, telefone, carro e vendedor
-- ============================================================
-- Pedido do Pietro (2026-09-14): saber QUEM chamou, sobre QUAL carro e pra
-- QUAL vendedor foi, pra cobrar o andamento. Ate aqui o botao ia direto pro
-- WhatsApp e o site nao ficava sabendo de nada: a aba Contatos do painel
-- ficava sempre zerada.
--
-- Agora o botao abre uma janelinha com nome e WhatsApp. O envio passa por
-- esta funcao, que grava o contato E decide o vendedor na mesma chamada, pra
-- que o vendedor gravado no painel seja exatamente o que recebeu a conversa.
-- ============================================================

alter table public.leads
  add column if not exists vendedor_id uuid references public.vendedores(id) on delete set null;

comment on column public.leads.vendedor_id is
  'Vendedor pra quem o contato foi mandado no WhatsApp.';

create index if not exists leads_telefone_idx on public.leads (telefone, criado_em desc);

/**
 * Grava o contato e devolve o vendedor que vai atender.
 *
 * Quem atende, nesta ordem:
 *   1. o vendedor escolhido pela pessoa (link "WhatsApp Solon" do rodape);
 *   2. o responsavel pelo carro, quando o carro tem um;
 *   3. o MESMO vendedor que atendeu esse telefone nas ultimas 24 horas. Sem
 *      isso, quem clica no cabecalho e depois na pagina do carro cairia com
 *      dois vendedores diferentes, e os dois disputariam o mesmo cliente;
 *   4. o rodizio (proximo_vendedor), que soma 1 no contador de quem esta na vez.
 *
 * Nao grava de novo o mesmo telefone, sobre o mesmo carro e pela mesma origem
 * dentro de 1 hora (a pessoa voltou e clicou de novo), e nao grava mais de 20
 * contatos por hora do mesmo IP (robo). Nos dois casos AINDA devolve o
 * vendedor: a pessoa sempre chega no WhatsApp.
 *
 * O carro so conta se estiver publicado: id de rascunho mandado na mao vira
 * contato sem carro, e nao revela nada sobre o rascunho.
 */
create or replace function public.registrar_contato(
  p_nome        text,
  p_telefone    text,
  p_mensagem    text default '',
  p_veiculo_id  uuid default null,
  p_vendedor_id uuid default null,
  p_origem      text default 'site',
  p_ip_hash     text default null,
  p_user_agent  text default null
)
returns table (nome text, whatsapp text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome     text := btrim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g'));
  v_tel      text := regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g');
  v_veiculo  uuid;
  v_resp     uuid;
  v_vend_id  uuid;
  v_vend_nome text;
  v_vend_zap  text;
begin
  -- Numero colado com o 55 do Brasil na frente.
  if length(v_tel) in (12, 13) and left(v_tel, 2) = '55' then
    v_tel := substr(v_tel, 3);
  end if;

  if length(v_nome) < 2 or length(v_nome) > 80 then
    raise exception 'nome invalido';
  end if;

  if length(v_tel) not in (10, 11) then
    raise exception 'telefone invalido';
  end if;

  if length(coalesce(p_mensagem, '')) > 2000 then
    raise exception 'mensagem muito longa';
  end if;

  if p_origem not in ('site', 'veiculo', 'vender-meu-carro', 'financiamento') then
    raise exception 'origem invalida';
  end if;

  if p_veiculo_id is not null then
    select v.id, v.vendedor_id into v_veiculo, v_resp
      from public.veiculos v
     where v.id = p_veiculo_id and v.status = 'publicado';
  end if;

  -- 1 e 2: escolha da pessoa ou responsavel pelo carro, se estiver ativo.
  select vd.id, vd.nome, vd.whatsapp into v_vend_id, v_vend_nome, v_vend_zap
    from public.vendedores vd
   where vd.ativo and vd.id = coalesce(p_vendedor_id, v_resp)
   limit 1;

  -- 3: quem ja atendeu esse telefone hoje.
  if v_vend_id is null then
    select vd.id, vd.nome, vd.whatsapp into v_vend_id, v_vend_nome, v_vend_zap
      from public.leads l
      join public.vendedores vd on vd.id = l.vendedor_id and vd.ativo
     where l.telefone = v_tel
       and l.criado_em > now() - interval '24 hours'
     order by l.criado_em desc
     limit 1;
  end if;

  -- 4: rodizio.
  if v_vend_id is null then
    select pv.id, pv.nome, pv.whatsapp into v_vend_id, v_vend_nome, v_vend_zap
      from public.proximo_vendedor() pv;
  end if;

  if not exists (
       select 1 from public.leads l
        where l.telefone = v_tel
          and l.veiculo_id is not distinct from v_veiculo
          and l.origem = p_origem
          and l.criado_em > now() - interval '1 hour'
     )
     and (
       p_ip_hash is null
       or (select count(*) from public.leads l
            where l.ip_hash = left(p_ip_hash, 64)
              and l.criado_em > now() - interval '1 hour') < 20
     )
  then
    insert into public.leads
      (nome, telefone, mensagem, veiculo_id, vendedor_id, origem, ip_hash, user_agent)
    values (
      v_nome,
      v_tel,
      left(btrim(coalesce(p_mensagem, '')), 2000),
      v_veiculo,
      v_vend_id,
      p_origem,
      left(coalesce(p_ip_hash, ''), 64),
      left(coalesce(p_user_agent, ''), 300)
    );
  end if;

  if v_vend_id is not null then
    nome := v_vend_nome;
    whatsapp := v_vend_zap;
    return next;
  end if;
end;
$$;

revoke execute on function public.registrar_contato(text,text,text,uuid,uuid,text,text,text) from public;
grant execute on function public.registrar_contato(text,text,text,uuid,uuid,text,text,text)
  to anon, authenticated;
