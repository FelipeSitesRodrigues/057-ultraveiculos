-- ------------------------------------------------------------
-- Espelho das fotos de cliente
-- ------------------------------------------------------------
-- O Pietro pediu que as fotos do carrossel "Quem ja e da Ultra" fiquem todas
-- com o carro virado pro mesmo lado. Espelhar o arquivo resolveria, mas e
-- caminho sem volta: perde qualidade a cada rodada e inverte o logo da
-- plaquinha vermelha da Ultra quando ela aparece na foto.
--
-- Entao o espelho vira ESTADO, nao edicao. Aqui fica a lista dos arquivos que
-- o site deve exibir invertidos, e o carrossel aplica um scaleX(-1) no CSS.
-- Marcar e desmarcar e um clique no painel, sem tocar no arquivo.
--
-- As fotos continuam na pasta `public/img/clientes` do projeto: quem sobe foto
-- nova ainda e o Felipe, por commit. Se um dia o Pietro passar a subir sozinho,
-- isso aqui vira tabela com caminho no Storage e esta chave sai.
--
-- Nasce com 01 e 08 marcadas porque sao justamente as duas que apontavam pro
-- lado contrario das outras nove, e o site ja estava no ar assim.

insert into public.config (chave, valor, publica)
values ('fotos_clientes', '{"espelhadas": ["01.webp", "08.webp"]}'::jsonb, true)
on conflict (chave) do nothing;
