-- Tira do site o carro que eu criei testando o painel.
--
-- A trava por data existe porque o criterio "modelo = Argo" sozinho pegaria
-- um Argo real cadastrado pela loja. Migration de limpeza roda de novo em
-- qualquer banco novo, entao ela precisa ser inofensiva fora do dia em que
-- foi escrita.
update public.veiculos
   set status = 'rascunho',
       descricao = 'Carro de exemplo, criado no teste do painel. Pode arquivar.'
 where modelo = 'Argo'
   and id_externo is null
   and criado_em < '2026-08-28 16:20:00+00';
