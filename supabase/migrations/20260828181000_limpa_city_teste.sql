-- Remove o City do teste do formulario novo.
-- Trava por data: sem ela, esta migration apagaria qualquer Honda City que a
-- loja cadastrasse, hoje ou daqui a um ano.
delete from public.veiculos
 where modelo = 'City'
   and id_externo is null
   and criado_em < '2026-08-28 16:20:00+00';
