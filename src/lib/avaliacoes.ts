/**
 * Avaliacoes reais do Google Meu Negocio da Ultra Veiculos.
 * Coletadas em 2026-08-28, transcritas literalmente (so com a pontuacao
 * arrumada). Nao inventar depoimento aqui: e prova social, e prova social
 * inventada e propaganda enganosa.
 *
 * As mais fortes citam o vendedor pelo nome, que e o padrao que aparece nas
 * 362 avaliacoes da loja.
 */

export type Avaliacao = {
  nome: string
  texto: string
  /**
   * quando e vendedor continuam gravados aqui como registro da coleta, mas
   * nao aparecem mais no cartao: o Pietro pediu em 2026-09-10 pra tirar o
   * tempo da avaliacao e o nome de quem atendeu. Se ele mudar de ideia, o
   * dado ja esta aqui e so precisa voltar pro figcaption de Avaliacoes.tsx.
   */
  quando: string
  vendedor?: string
}

export const AVALIACOES: Avaliacao[] = [
  {
    nome: 'Ricardinho Nenê',
    quando: 'há 6 meses',
    texto:
      'Loja espetacular. Cliente de muitos anos, nunca tive sequer um problema. Só carros de qualidade e procedência. Recomendo.',
  },
  {
    nome: 'Kelly Alves',
    quando: 'há 2 meses',
    texto:
      'Super indico! Fomos atendidos pelo Adenilson, que esclareceu todas as dúvidas e me deixou confortável em adquirir meu primeiro carro.',
    vendedor: 'Adenilson',
  },
  {
    nome: 'Vitor Lima',
    quando: 'há 1 ano',
    texto:
      'Excelente loja para comprar um carro. Fomos atendidos pelo vendedor Sólon, que sempre nos atendeu com muita cordialidade e transparência. Ele mostrou todas as etapas de preparação do veículo, como polimento e troca de óleo.',
    vendedor: 'Sólon',
  },
  {
    nome: 'Lucas Eduardo da Silva',
    quando: 'há 5 meses',
    texto:
      'Ótima experiência na compra do veículo. Possuem um bom atendimento no pós-venda, principalmente em cumprir com a garantia caso o veículo apresente algum defeito.',
  },
  {
    nome: 'Thiago Moraes',
    quando: 'há 9 meses',
    texto:
      'Transparência total no processo, tudo muito bem explicado. O carro foi entregue em ótimas condições. Recomendo muito a Ultra Veículos para quem busca confiança e segurança para comprar seu carro.',
    vendedor: 'Sólon',
  },
  {
    nome: 'Noeli Franco da Silva',
    quando: 'há 8 meses',
    texto:
      'Atendimento top, super recomendo. Já é o terceiro carro que compro com a agência Ultra!',
  },
]

/** Link pra ficha da loja no Google, pra pessoa conferir que e real. */
export const LINK_GOOGLE =
  'https://www.google.com/maps/search/?api=1&query=Ultra+Ve%C3%ADculos+Suzano'
