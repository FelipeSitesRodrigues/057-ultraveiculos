-- ============================================================
-- Busca que perdoa acento e erro de digitacao
-- ============================================================
-- Quem procura "Citroen" nao encontrava "Citroën". Quem digita "Renaut" ou
-- "Hunday" tambem nao encontrava nada. Numa loja com 20 carros, busca que
-- exige grafia exata e busca que nao serve.
--
-- Tres camadas, da mais barata pra mais cara:
--   1. coluna sem acento e em minuscula, pronta pra comparar
--   2. indice trigrama, que faz "contem" ser rapido mesmo com % na frente
--   3. funcao de similaridade, usada so quando a busca exata nao acha nada
-- ============================================================

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

/**
 * Tira acento e baixa a caixa.
 *
 * A forma de dois argumentos (com o dicionario nomeado) e o que torna a funcao
 * deterministica: sem isso o Postgres a considera instavel e recusa usa-la
 * numa coluna gerada.
 */
create or replace function public.sem_acento(t text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent', t))
$$;

-- Texto do veiculo pronto pra busca, mantido pelo proprio banco.
alter table public.veiculos
  add column if not exists busca_simples text
  generated always as (
    public.sem_acento(
      coalesce(marca, '') || ' ' ||
      coalesce(modelo, '') || ' ' ||
      coalesce(versao, '') || ' ' ||
      coalesce(cor, '') || ' ' ||
      coalesce(carroceria, '') || ' ' ||
      coalesce(ano_modelo::text, '')
    )
  ) stored;

comment on column public.veiculos.busca_simples is
  'Marca, modelo, versao, cor, carroceria e ano sem acento e em minuscula. Base da busca do site.';

create index if not exists veiculos_busca_simples_trgm
  on public.veiculos using gin (busca_simples extensions.gin_trgm_ops);

/**
 * Busca tolerante a erro de digitacao.
 *
 * Usada so como segunda tentativa: se a busca normal ja achou alguma coisa,
 * esta funcao nem roda. Ela existe pra "Renaut", "Hunday", "Corola".
 *
 * Devolve so os ids. Quem monta o resultado e a consulta normal, que ja
 * respeita a RLS: assim nao ha um segundo caminho de leitura pra manter em pe.
 */
create or replace function public.veiculos_parecidos(termo text)
returns table (id uuid)
language sql
stable
security invoker
set search_path = ''
as $$
  select v.id
    from public.veiculos v
   where v.status = 'publicado'
     and extensions.similarity(v.busca_simples, public.sem_acento(termo)) > 0.18
   order by extensions.similarity(v.busca_simples, public.sem_acento(termo)) desc
   limit 24
$$;

grant execute on function public.sem_acento(text) to anon, authenticated;
grant execute on function public.veiculos_parecidos(text) to anon, authenticated;
