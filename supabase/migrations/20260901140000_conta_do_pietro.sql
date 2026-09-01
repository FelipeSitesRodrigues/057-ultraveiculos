-- Conta do Pietro no painel.
--
-- POR QUE A SENHA NAO ESTA ESCRITA AQUI: este arquivo vai pro GitHub. Senha em
-- texto puro dentro de migration fica no historico do repositorio pra sempre,
-- e nao sai mais de la nem apagando depois. Entao a senha e SORTEADA pelo
-- proprio Postgres na hora em que a migration roda, e guardada por alguns
-- minutos numa linha de `config` com publica = false (so a equipe le, o site
-- nunca), que e apagada assim que a senha for entregue.
--
-- POR QUE PRECISA DE LINHA EM `perfis`: ter conta no Supabase nao e ser da
-- equipe. `is_staff()` exige perfil ativo, e nao existe gatilho que crie um
-- sozinho. Isso e de proposito: se o cadastro publico for religado um dia,
-- ninguem vira administrador so por se cadastrar.
--
-- Idempotente: rodar de novo nao recria nem troca a senha de quem ja existe.

do $$
declare
  novo_id  uuid := gen_random_uuid();
  senha    text;
  ja_tem   boolean;
begin
  select exists (select 1 from auth.users where email = 'pietro@ultraveiculos.com.br')
    into ja_tem;

  if ja_tem then
    raise notice 'Pietro ja existe, nada a fazer.';
    return;
  end if;

  -- Legivel o suficiente pra digitar no celular, aleatoria o suficiente pra
  -- ninguem adivinhar.
  senha := 'Ultra-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);

  -- Os campos de token vao como string vazia, e nao NULL, de proposito: o
  -- servico de login do Supabase quebra ao ler NULL nesses campos, e o erro
  -- que aparece na tela nao tem nada a ver com a causa.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', novo_id, 'authenticated', 'authenticated',
    'pietro@ultraveiculos.com.br',
    extensions.crypt(senha, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '', '', '', ''
  );

  -- Sem a identidade, o login por e-mail e senha nao encontra a conta.
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), novo_id, novo_id::text,
    jsonb_build_object('sub', novo_id::text, 'email', 'pietro@ultraveiculos.com.br'),
    'email', now(), now(), now()
  );

  insert into public.perfis (id, nome, role, ativo)
  values (novo_id, 'Pietro', 'admin', true)
  on conflict (id) do update set ativo = true;

  -- Entrega temporaria. APAGAR depois de passar a senha:
  --   delete from public.config where chave = 'senha_temporaria_pietro';
  insert into public.config (chave, valor, publica)
  values ('senha_temporaria_pietro', to_jsonb(senha), false)
  on conflict (chave) do update set valor = excluded.valor, publica = false;
end
$$;
