-- Remove o City usado pra testar o envio das 12 fotos.
-- Mesma trava por data da migration anterior.
delete from public.veiculos
 where modelo = 'City'
   and id_externo is null
   and criado_em < '2026-08-28 16:20:00+00';
