#!/usr/bin/env bash
# ============================================================
# Teste de RLS do Ultra Veiculos
# ============================================================
# Roda contra o banco de verdade usando a MESMA chave publica que vai
# dentro do site. Ou seja: e exatamente o que um visitante consegue fazer.
#
# Uso:  bash scripts/teste-rls.sh
#
# Rodar sempre que mexer em policy, tabela nova ou funcao. Se qualquer
# linha voltar FALHOU, tem coisa exposta que nao devia.
# ============================================================
set -uo pipefail
cd "$(dirname "$0")/.."

ANON=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d= -f2)
BASE=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d= -f2)
URL="$BASE/rest/v1"
H=(-H "apikey: $ANON" -H "Authorization: Bearer $ANON" -H "Content-Type: application/json")

falhas=0

# espera_conter <descricao> <trecho esperado na resposta> <resposta>
espera_conter() {
  if [[ "$3" == *"$2"* ]]; then
    echo "  ok      $1"
  else
    echo "  FALHOU  $1"
    echo "          esperava conter: $2"
    echo "          veio: ${3:0:200}"
    falhas=$((falhas + 1))
  fi
}

echo "Testando como VISITANTE (chave anon), contra $BASE"
echo
echo "Dado sensivel de negocio (o risco numero 1 do projeto):"
espera_conter "custo e preco minimo nao sao legiveis" "permission denied" \
  "$(curl -s "$URL/veiculo_financeiro?select=*" "${H[@]}")"
espera_conter "nao vaza por join aninhado" "permission denied" \
  "$(curl -s "$URL/veiculos?select=marca,veiculo_financeiro(*)" "${H[@]}")"
espera_conter "nao vaza por embedding com alias" "permission denied" \
  "$(curl -s "$URL/veiculos?select=marca,fin:veiculo_financeiro(custo_centavos)" "${H[@]}")"
espera_conter "nao da pra filtrar por coluna proibida" "not an embedded resource" \
  "$(curl -s "$URL/veiculos?select=marca&veiculo_financeiro.custo_centavos=gt.0" "${H[@]}")"
espera_conter "leads nao sao legiveis" "permission denied" \
  "$(curl -s "$URL/leads?select=*" "${H[@]}")"

# O curinga e o erro classico: um "select *" distraido trazendo o custo junto.
# Aqui ele nao tem como trazer, porque a coluna mora em outra tabela.
resposta_curinga="$(curl -s "$URL/veiculos?select=*&limit=1" "${H[@]}")"
if [[ "$resposta_curinga" == *"custo_centavos"* || "$resposta_curinga" == *"minimo_centavos"* ]]; then
  echo "  FALHOU  select * em veiculos trouxe coluna de custo"
  falhas=$((falhas + 1))
else
  echo "  ok      select * em veiculos nao traz custo nem minimo"
fi

echo
echo "Escrita:"
espera_conter "visitante nao insere veiculo" "violates row-level security" \
  "$(curl -s "$URL/veiculos" "${H[@]}" -d '{"slug":"teste-invasao","marca":"X"}')"
espera_conter "visitante nao insere lead direto na tabela" "permission denied" \
  "$(curl -s "$URL/leads" "${H[@]}" -d '{"nome":"Invasor","telefone":"11999999999"}')"
espera_conter "visitante nao insere vendedor" "violates row-level security" \
  "$(curl -s "$URL/vendedores" "${H[@]}" -d '{"nome":"Invasor","whatsapp":"5511999999999"}')"
espera_conter "visitante nao insere banner" "violates row-level security" \
  "$(curl -s "$URL/banners" "${H[@]}" -d '{"imagem_path":"x.webp"}')"
espera_conter "visitante nao mexe na config" "violates row-level security" \
  "$(curl -s "$URL/config" "${H[@]}" -d '{"chave":"invasao","valor":"{}"}')"

echo
echo "Formulario de lead (unica porta de escrita do visitante):"
espera_conter "recusa nome curto" "nome invalido" \
  "$(curl -s "$URL/rpc/registrar_lead" "${H[@]}" -d '{"p_nome":"A","p_telefone":"11981404811"}')"
espera_conter "recusa telefone curto" "telefone invalido" \
  "$(curl -s "$URL/rpc/registrar_lead" "${H[@]}" -d '{"p_nome":"Fulano de Teste","p_telefone":"123"}')"
espera_conter "recusa origem inventada" "origem invalida" \
  "$(curl -s "$URL/rpc/registrar_lead" "${H[@]}" -d '{"p_nome":"Fulano de Teste","p_telefone":"11981404811","p_origem":"hack"}')"

echo
echo "Janelinha de contato (registrar_contato, desde 2026-09-14):"
# So casos recusados: o caso valido gravaria contato e mexeria no rodizio real.
espera_conter "recusa nome curto" "nome invalido" \
  "$(curl -s "$URL/rpc/registrar_contato" "${H[@]}" -d '{"p_nome":"A","p_telefone":"11981404811"}')"
espera_conter "recusa telefone sem DDD" "telefone invalido" \
  "$(curl -s "$URL/rpc/registrar_contato" "${H[@]}" -d '{"p_nome":"Fulano de Teste","p_telefone":"981404811"}')"
espera_conter "recusa origem inventada" "origem invalida" \
  "$(curl -s "$URL/rpc/registrar_contato" "${H[@]}" -d '{"p_nome":"Fulano de Teste","p_telefone":"11981404811","p_origem":"hack"}')"
espera_conter "visitante continua sem ler contatos" "permission denied" \
  "$(curl -s "$URL/leads?select=nome,telefone,vendedor_id" "${H[@]}")"

echo
echo "Leitura publica que DEVE funcionar:"
espera_conter "config publica da loja e legivel" "Benjamin Constant" \
  "$(curl -s "$URL/config?select=*&chave=eq.loja" "${H[@]}")"
espera_conter "vendedores ativos sao legiveis" "Adenilson" \
  "$(curl -s "$URL/vendedores?select=nome" "${H[@]}")"

echo
if [[ $falhas -eq 0 ]]; then
  echo "Tudo certo: nenhuma brecha encontrada."
else
  echo "$falhas teste(s) FALHARAM. Nao publicar assim."
  exit 1
fi
