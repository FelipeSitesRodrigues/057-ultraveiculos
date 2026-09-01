-- Remove o lead usado pra confirmar que a funcao de registro responde.
-- Trava por data, como toda limpeza deste projeto.
delete from public.leads
 where nome = 'Diagnostico'
   and criado_em < '2026-08-31 00:00:00+00';
