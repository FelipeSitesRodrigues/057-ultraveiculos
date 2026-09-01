-- Corrige a busca tolerante a erro de digitacao.
--
-- A versao anterior comparava o termo com o TEXTO INTEIRO do veiculo
-- ("citroen c3 1.6 feel pack flex branco hatch 2024"). Uma palavra curta
-- comparada com uma frase longa sempre da semelhanca baixa, entao "citroem"
-- nunca passava do corte.
--
-- word_similarity compara o termo com o trecho mais parecido do texto, que e
-- exatamente a pergunta certa: "existe alguma palavra aqui parecida com o que
-- a pessoa digitou?"
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
     and extensions.word_similarity(public.sem_acento(termo), v.busca_simples) > 0.45
   order by extensions.word_similarity(public.sem_acento(termo), v.busca_simples) desc
   limit 24
$$;

grant execute on function public.veiculos_parecidos(text) to anon, authenticated;
