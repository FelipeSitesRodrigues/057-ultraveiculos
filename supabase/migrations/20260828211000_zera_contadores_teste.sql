-- Zera os contadores usados nos meus testes do rodizio, pra loja comecar do
-- zero. Trava por data: em qualquer banco novo isso nao alcanca contagem real.
update public.vendedores
   set atendimentos = 0
 where atualizado_em < '2026-08-28 18:00:00+00';
