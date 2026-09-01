-- ============================================================
-- Rodizio de atendimento entre os vendedores
-- ============================================================
-- Pedido do Pietro: um lead vai pro Adenilson, o proximo pro Solon, e assim
-- por diante.
--
-- A conta nao e "alterna par e impar", e sim "manda pra quem recebeu menos".
-- Nos dois casos o resultado e o mesmo enquanto todo mundo esta ativo, mas
-- quando um vendedor entra de ferias, sai ou entra na equipe, a fila por menor
-- contagem se reequilibra sozinha, e a alternancia fixa nao.
-- ============================================================

alter table public.vendedores
  add column if not exists atendimentos integer not null default 0;

comment on column public.vendedores.atendimentos is
  'Quantos contatos o vendedor recebeu pelo rodizio do site.';

/**
 * Devolve o vendedor da vez e ja conta o atendimento.
 *
 * security definer porque o visitante nao tem (e nao deve ter) permissao de
 * escrita em vendedores. A funcao e a unica porta: ela nao aceita parametro
 * nenhum, entao nao ha o que injetar, e o unico efeito possivel e somar 1 no
 * contador de quem esta na vez.
 *
 * O update com order by + limit 1 dentro de uma unica instrucao evita dois
 * cliques simultaneos caindo no mesmo vendedor.
 */
create or replace function public.proximo_vendedor()
returns table (id uuid, nome text, whatsapp text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  update public.vendedores v
     set atendimentos = v.atendimentos + 1
   where v.id = (
     select v2.id
       from public.vendedores v2
      where v2.ativo
      order by v2.atendimentos asc, v2.ordem asc
      limit 1
      for update skip locked
   )
  returning v.id, v.nome, v.whatsapp;
end;
$$;

revoke execute on function public.proximo_vendedor() from public;
grant execute on function public.proximo_vendedor() to anon, authenticated;
