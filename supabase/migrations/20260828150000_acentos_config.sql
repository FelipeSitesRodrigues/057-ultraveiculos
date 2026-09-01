-- Corrige acentuacao dos textos que o site exibe direto da config.
-- O nome da loja aparece no rodape e o aviso aparece embaixo do simulador.

update public.config
   set valor = jsonb_set(valor, '{nome}', '"Ultra Veículos"')
 where chave = 'loja';

update public.config
   set valor = jsonb_set(
         valor,
         '{aviso}',
         '"Valor estimado. Simulação sem compromisso, sujeita a análise de crédito. Não é oferta de crédito."'
       )
 where chave = 'financiamento';

update public.config
   set valor = jsonb_set(valor, '{semana}', '"09:00 às 19:00"')
 where chave = 'horario';

update public.config
   set valor = jsonb_set(valor, '{sabado}', '"09:00 às 15:00"')
 where chave = 'horario';
