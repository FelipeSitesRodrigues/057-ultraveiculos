-- ============================================================
-- Ultra Veiculos (057) - estoque de DEMONSTRACAO
-- ============================================================
-- TEMPORARIO. Serve pra revisar layout, filtro e simulador antes de o
-- Leandro cadastrar o estoque real pelo painel.
--
-- Todos tem `id_externo` comecando com 'demo-'. Pra limpar tudo depois:
--   delete from public.veiculos where id_externo like 'demo-%';
-- (o financeiro e as fotos caem junto por cascade)
-- ============================================================

with novos as (
  insert into public.veiculos (
    slug, status, destaque, premium, ordem,
    marca, modelo, versao, ano_fabricacao, ano_modelo, km,
    preco_centavos, cambio, combustivel, cor, portas, carroceria,
    placa_final, descricao, ficha, opcionais, entrou_em, id_externo
  ) values
  (
    'chevrolet-onix-plus-1-0-turbo-ltz-2022-d001', 'publicado', true, false, 1,
    'Chevrolet', 'Onix Plus', '1.0 Turbo LTZ Aut. 4p', 2022, 2022, 48000,
    9890000, 'Automático', 'Flex', 'Prata', 4, 'Sedã',
    3, 'Sedã completo, revisado e com manual e chave reserva. Segundo dono, procedência conferida.',
    '{"Motor":"1.0 Turbo","Potência":"116 cv","Direção":"Elétrica","Tanque":"44 L"}'::jsonb,
    array['Ar condicionado','Direção elétrica','Vidros elétricos','Travas elétricas','Câmera de ré','Central multimídia','Apple CarPlay / Android Auto','Airbag duplo','ABS','Controle de estabilidade'],
    current_date - 12, 'demo-001'
  ),
  (
    'hyundai-hb20-1-0-comfort-plus-2021-d002', 'publicado', true, false, 2,
    'Hyundai', 'HB20', '1.0 Comfort Plus Flex 5p', 2021, 2021, 62000,
    6790000, 'Manual', 'Flex', 'Branco', 4, 'Hatch',
    7, 'Hatch econômico, ideal para primeiro carro. Pneus novos e revisão em dia.',
    '{"Motor":"1.0","Potência":"80 cv","Direção":"Elétrica","Tanque":"50 L"}'::jsonb,
    array['Ar condicionado','Direção elétrica','Vidros elétricos','Travas elétricas','Bluetooth','Airbag duplo','ABS'],
    current_date - 41, 'demo-002'
  ),
  (
    'chevrolet-tracker-1-2-turbo-premier-2022-d003', 'publicado', true, false, 3,
    'Chevrolet', 'Tracker', '1.2 Turbo Premier Aut. 5p', 2022, 2022, 39000,
    12490000, 'Automático', 'Flex', 'Preto', 4, 'SUV',
    1, 'SUV topo de linha, teto solar e bancos em couro. Único dono.',
    '{"Motor":"1.2 Turbo","Potência":"133 cv","Direção":"Elétrica","Tanque":"44 L"}'::jsonb,
    array['Ar digital','Direção elétrica','Câmera de ré','Sensor de estacionamento','Central multimídia','Banco de couro','Teto solar','Piloto automático','Rodas de liga leve','Controle de estabilidade'],
    current_date - 5, 'demo-003'
  ),
  (
    'jeep-renegade-1-8-longitude-2019-d004', 'publicado', false, false, 4,
    'Jeep', 'Renegade', '1.8 Longitude Flex Aut. 5p', 2019, 2019, 88000,
    9190000, 'Automático', 'Flex', 'Cinza', 4, 'SUV',
    5, 'SUV robusto, revisado na entrega, com garantia de motor e câmbio.',
    '{"Motor":"1.8","Potência":"139 cv","Direção":"Elétrica","Tanque":"48 L"}'::jsonb,
    array['Ar condicionado','Direção elétrica','Câmera de ré','Central multimídia','Rodas de liga leve','Airbag duplo','ABS','Controle de tração'],
    current_date - 97, 'demo-004'
  ),
  (
    'toyota-corolla-2-0-xei-2020-d005', 'publicado', false, true, 5,
    'Toyota', 'Corolla', '2.0 XEi Flex Aut. 4p', 2020, 2020, 71000,
    13890000, 'Automático', 'Flex', 'Prata', 4, 'Sedã',
    9, 'Sedã premium, manutenção feita em concessionária, laudo cautelar aprovado.',
    '{"Motor":"2.0","Potência":"177 cv","Direção":"Elétrica","Tanque":"50 L"}'::jsonb,
    array['Ar digital','Direção elétrica','Câmera de ré','Sensor de estacionamento','Central multimídia','Banco de couro','Piloto automático','Controle de estabilidade','Keyless Entry / Start'],
    current_date - 23, 'demo-005'
  ),
  (
    'volkswagen-t-cross-200-tsi-comfortline-2021-d006', 'publicado', false, false, 6,
    'Volkswagen', 'T-Cross', '200 TSI Comfortline Aut. 5p', 2021, 2021, 54000,
    11590000, 'Automático', 'Flex', 'Branco', 4, 'SUV',
    2, 'SUV familiar, porta-malas grande e consumo baixo. Segundo dono.',
    '{"Motor":"1.0 TSI","Potência":"128 cv","Direção":"Elétrica","Tanque":"52 L"}'::jsonb,
    array['Ar digital','Direção elétrica','Câmera de ré','Central multimídia','Apple CarPlay / Android Auto','Rodas de liga leve','Controle de estabilidade'],
    current_date - 18, 'demo-006'
  ),
  (
    'fiat-strada-1-3-freedom-cd-2022-d007', 'publicado', false, false, 7,
    'Fiat', 'Strada', '1.3 Freedom CD 4p', 2022, 2022, 45000,
    9690000, 'Manual', 'Flex', 'Vermelho', 4, 'Picape',
    4, 'Picape cabine dupla, ideal para trabalho e família. Pouco rodada.',
    '{"Motor":"1.3","Potência":"109 cv","Direção":"Elétrica","Tanque":"55 L"}'::jsonb,
    array['Ar condicionado','Direção elétrica','Vidros elétricos','Central multimídia','Airbag duplo','ABS'],
    current_date - 60, 'demo-007'
  ),
  (
    'honda-civic-2-0-exl-2019-d008', 'publicado', false, true, 8,
    'Honda', 'Civic', '2.0 EXL Flex CVT 4p', 2019, 2019, 79000,
    11890000, 'Automático', 'Flex', 'Preto', 4, 'Sedã',
    8, 'Sedã completo, bancos em couro e teto solar. Revisões em dia.',
    '{"Motor":"2.0","Potência":"155 cv","Direção":"Elétrica","Tanque":"47 L"}'::jsonb,
    array['Ar digital','Direção elétrica','Câmera de ré','Sensor de estacionamento','Banco de couro','Teto solar','Piloto automático','Controle de estabilidade','Rodas de liga leve'],
    current_date - 132, 'demo-008'
  )
  returning id, preco_centavos
)
-- Margem de demonstracao: custo em 78% do preco, piso de venda em 92%.
insert into public.veiculo_financeiro (veiculo_id, custo_centavos, minimo_centavos)
select id, round(preco_centavos * 0.78), round(preco_centavos * 0.92) from novos;
