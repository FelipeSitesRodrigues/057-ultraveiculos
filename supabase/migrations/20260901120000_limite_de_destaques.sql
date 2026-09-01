-- Destaque agora significa "aparece na primeira parte da home", e no maximo
-- OITO carros podem estar assim ao mesmo tempo.
--
-- A regra mora AQUI, e nao so na tela, por dois motivos: a tela pode ser
-- contornada (o painel escreve pela API do Supabase, nao so pelo formulario) e
-- porque duas pessoas marcando ao mesmo tempo passariam do limite se a
-- contagem fosse feita antes de gravar, no navegador.
--
-- Regra 2: carro que sai do ar PERDE o destaque sozinho. Destaque so significa
-- alguma coisa em carro publicado; slot preso num carro vendido faria a home
-- mostrar menos carros do que o painel diz estarem em destaque, e ninguem
-- entenderia por que.

create or replace function public.limita_destaques()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  quantos       int;
  precisa_olhar boolean;
begin
  if new.status <> 'publicado' then
    new.destaque := false;
    return new;
  end if;

  if not new.destaque then
    return new;
  end if;

  -- So conta quando o carro ESTA ENTRANDO no destaque. Sem isso, qualquer
  -- edicao de um carro que ja e destaque (trocar o preco, por exemplo) seria
  -- recusada assim que os oito slots estivessem cheios.
  if tg_op = 'INSERT' then
    precisa_olhar := true;
  else
    precisa_olhar := (not old.destaque) or (old.status <> 'publicado');
  end if;

  if precisa_olhar then
    select count(*)
      into quantos
      from public.veiculos v
     where v.destaque
       and v.status = 'publicado'
       and v.id <> new.id;

    if quantos >= 8 then
      -- Mensagem curta e estavel: o painel procura por ela pra mostrar um
      -- aviso em portugues em vez do erro cru do Postgres.
      raise exception 'limite_destaques';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists veiculos_limita_destaques on public.veiculos;

create trigger veiculos_limita_destaques
before insert or update on public.veiculos
for each row execute function public.limita_destaques();

comment on column public.veiculos.destaque is
  'Aparece na primeira parte da home. No maximo 8, garantido pelo trigger veiculos_limita_destaques.';

-- Se o estoque de hoje ja passar de oito destaques (o campo existia com outro
-- significado, o selo vermelho), mantem os oito mais recentes e solta o resto.
-- Trava por data pra esta limpeza ser inofensiva em banco novo, onde nao ha
-- nada anterior a ela pra desmarcar.
update public.veiculos
   set destaque = false
 where destaque
   and criado_em < '2026-09-01 12:00:00+00'
   and id not in (
     select id
       from public.veiculos
      where destaque
        and status = 'publicado'
        and criado_em < '2026-09-01 12:00:00+00'
      order by ordem asc, criado_em desc
      limit 8
   );
