/**
 * Calculo de parcela, isolado de proposito.
 *
 * Hoje usa Tabela Price, que e o padrao de financiamento de veiculo no Brasil.
 * O Pietro vai mandar a conta que a loja usa de verdade. Quando mandar, se for
 * outra formula, SO ESTE ARQUIVO muda. Nenhuma tela precisa ser tocada.
 *
 * Taxa, prazo e entrada minima vem da tabela `config` do banco e sao editaveis
 * no painel, entao trocar so os numeros nao exige nem deploy.
 *
 * Aviso obrigatorio em toda tela que mostrar parcela: valor estimado, sujeito a
 * analise de credito, nao e oferta de credito. Sem isso, parcela publicada
 * vira oferta de credito, que e atividade regulada.
 */

export type EntradaSimulacao = {
  /** preco do veiculo em centavos */
  precoCentavos: number
  /** entrada em centavos */
  entradaCentavos: number
  /** numero de parcelas */
  prazo: number
  /** taxa de juros ao mes, em decimal. 0.0189 = 1,89% a.m. */
  taxaAoMes: number
}

export type ResultadoSimulacao = {
  parcelaCentavos: number
  financiadoCentavos: number
  totalPagoCentavos: number
  jurosCentavos: number
  prazo: number
  taxaAoMes: number
}

/**
 * Price: parcela fixa.
 *   PMT = PV * i / (1 - (1 + i)^-n)
 */
export function calcularParcela(e: EntradaSimulacao): ResultadoSimulacao {
  const financiado = Math.max(0, Math.round(e.precoCentavos - e.entradaCentavos))
  const n = Math.max(1, Math.round(e.prazo))
  const i = Math.max(0, e.taxaAoMes)

  if (financiado === 0) {
    return {
      parcelaCentavos: 0,
      financiadoCentavos: 0,
      totalPagoCentavos: 0,
      jurosCentavos: 0,
      prazo: n,
      taxaAoMes: i,
    }
  }

  // Taxa zero vira divisao simples, senao a formula estoura em 0/0.
  const parcela =
    i === 0 ? financiado / n : (financiado * i) / (1 - Math.pow(1 + i, -n))

  const parcelaCentavos = Math.round(parcela)
  const totalPago = parcelaCentavos * n

  return {
    parcelaCentavos,
    financiadoCentavos: financiado,
    totalPagoCentavos: totalPago,
    jurosCentavos: totalPago - financiado,
    prazo: n,
    taxaAoMes: i,
  }
}

/**
 * "A partir de R$ X/mes" do card: usa o prazo maximo e a entrada minima,
 * que e o cenario que produz a menor parcela. Por isso a frase e
 * "a partir de", nunca "por".
 */
export function parcelaAPartirDe(
  precoCentavos: number,
  cfg: { taxa_am: number; prazo_max: number; entrada_min_pct: number },
): number {
  const { parcelaCentavos } = calcularParcela({
    precoCentavos,
    entradaCentavos: Math.round(precoCentavos * cfg.entrada_min_pct),
    prazo: cfg.prazo_max,
    taxaAoMes: cfg.taxa_am,
  })
  return parcelaCentavos
}
