-- Remove o contato usado pra testar a pagina de "vender meu carro".
-- Trava por data, como toda limpeza deste projeto.
delete from public.leads
 where nome = 'Felipe Teste'
   and criado_em < '2026-08-31 00:00:00+00';
