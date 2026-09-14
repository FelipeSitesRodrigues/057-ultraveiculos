-- Remove o contato usado pra testar a janelinha no site publicado.
-- Trava por data, como toda limpeza deste projeto.
delete from public.leads
 where nome = 'Teste Claude'
   and telefone = '11900000000'
   and criado_em < '2026-09-15 00:00:00+00';
