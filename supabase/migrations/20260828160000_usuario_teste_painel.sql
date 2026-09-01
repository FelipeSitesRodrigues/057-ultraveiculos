-- TEMPORARIO: usuario de teste pra validar o painel antes de o Felipe
-- cadastrar a conta real dele.
--
-- Confirma o e-mail (a conta foi criada pela API de signup e ficou pendente)
-- e cria o perfil, que e o que de fato libera o painel: sem linha em `perfis`
-- com ativo = true, a sessao existe mas o painel recusa.
--
-- APAGAR quando a conta real existir:
--   delete from auth.users where email = 'teste.painel@ultraveiculos.com.br';

update auth.users
   set email_confirmed_at = coalesce(email_confirmed_at, now())
 where email = 'teste.painel@ultraveiculos.com.br';

insert into public.perfis (id, nome, role, ativo)
select id, 'Teste', 'admin', true
  from auth.users
 where email = 'teste.painel@ultraveiculos.com.br'
on conflict (id) do update set ativo = true;
