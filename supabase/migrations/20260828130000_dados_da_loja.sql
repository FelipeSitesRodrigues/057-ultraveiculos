-- ============================================================
-- Ultra Veiculos (057) - dados iniciais da loja
-- ============================================================
-- Nao e dado de teste: sao os vendedores reais e a configuracao que o
-- site le pra montar rodape, horario e simulador.
-- ============================================================

-- Limpa o lead usado no teste de RLS de 2026-08-28.
delete from public.leads where nome = 'Teste Seguranca';

-- ------------------------------------------------------------
-- Vendedores
-- ------------------------------------------------------------
insert into public.vendedores (nome, whatsapp, ativo, ordem) values
  ('Adenilson', '5511981404811', true, 1),
  ('Solon',     '5511964470628', true, 2)
on conflict do nothing;

-- ------------------------------------------------------------
-- Config
-- publica = true significa que o valor sai pro site. Tudo que aparece
-- na tela do visitante ja e publico de qualquer forma.
-- ------------------------------------------------------------
insert into public.config (chave, valor, publica) values
  ('loja', jsonb_build_object(
      'nome',       'Ultra Veiculos',
      'cidade',     'Suzano',
      'uf',         'SP',
      'endereco',   'Rua Benjamin Constant, 1650',
      'bairro',     'Centro',
      'cep',        '08674-178',
      'telefone',   '1142924502',
      'telefone_exibicao', '11 4292-4502'
   ), true),

  ('horario', jsonb_build_object(
      'semana',  '09:00 as 19:00',
      'sabado',  '09:00 as 15:00',
      'domingo', 'Fechado'
   ), true),

  ('google', jsonb_build_object(
      'nota',       4.9,
      'avaliacoes', 362
   ), true),

  -- Simulador PROVISORIO. Trocar quando o Pietro mandar a conta que a loja
  -- usa de verdade. Se a formula dele nao for Price, o calculo esta isolado
  -- em src/lib/parcela.ts e so aquele arquivo muda.
  ('financiamento', jsonb_build_object(
      'taxa_am',          0.0189,
      'prazo_max',        60,
      'prazo_padrao',     48,
      'entrada_min_pct',  0.20,
      'provisorio',       true,
      'aviso',            'Valor estimado. Simulacao sem compromisso, sujeita a analise de credito. Nao e oferta de credito.'
   ), true)
on conflict (chave) do update
  set valor = excluded.valor,
      publica = excluded.publica;
