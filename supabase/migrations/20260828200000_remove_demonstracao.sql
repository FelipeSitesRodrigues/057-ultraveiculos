-- Fora o estoque de demonstracao que eu inventei pra testar filtro, simulador
-- e layout. A partir daqui o site so mostra carro real, cadastrado pelo painel.
-- As fotos deles nunca existiram, entao nao sobra arquivo no bucket.
delete from public.veiculos where id_externo like 'demo-%';
