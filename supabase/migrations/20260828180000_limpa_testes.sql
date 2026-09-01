-- Remove os carros que EU criei testando o painel.
-- Trava por data pra nunca alcancar carro real da loja (ver comentario da
-- migration 20260828170000).
delete from public.veiculos
 where id_externo is null
   and modelo in ('Argo', 'City')
   and descricao like '%teste%'
   and criado_em < '2026-08-28 16:20:00+00';
