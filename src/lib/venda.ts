/**
 * Os DOIS caminhos da pagina "Venda seu carro".
 *
 * Vender e consignar sao negocios diferentes pra loja: na venda ela COMPRA o
 * carro; na consignacao ela EXPOE e vende PRA voce. Muda o que o visitante
 * espera, muda o que o vendedor responde e muda o que a pagina promete.
 *
 * Por isso a copy dos dois vive aqui, junta e lado a lado: assim da pra ver de
 * um olho se um caminho esta prometendo algo que o outro nao promete, e mexer
 * num nao deixa o outro pra tras.
 */

export type Intencao = 'venda' | 'consignacao'

export type Passo = { titulo: string; texto: string }

export type OpcaoVenda = {
  valor: Intencao
  /** Rotulo curto, usado no seletor do formulario. */
  rotulo: string
  /** O que a LOJA faz. E a frase que separa os dois caminhos. */
  chamada: string
  /** Uma linha, no painel de escolha. */
  resumo: string
  vantagens: string[]
  /** Texto do botao dentro do painel. */
  botao: string
  /** Titulo da secao do formulario. */
  tituloForm: string
  subtituloForm: string
  /** Linha de honestidade embaixo do botao de WhatsApp. */
  aviso: string
  passosTitulo: string
  passos: Passo[]
  /** Primeira e ultima linha da mensagem que chega pro vendedor. */
  abertura: string
  fecho: string
}

export const OPCOES_VENDA: OpcaoVenda[] = [
  {
    valor: 'venda',
    rotulo: 'Vender agora',
    // Do mesmo tamanho da chamada do outro lado, de proposito: as duas ocupam
    // uma linha so na metade do bloco no celular, e as duas metades ficam
    // alinhadas linha a linha em vez de uma correr atras da outra.
    chamada: 'A loja compra o carro',
    resumo: 'Você avalia hoje e sai da loja com o negócio fechado.',
    vantagens: [
      'Avaliação presencial e proposta na hora',
      'Pagamento e documentação no mesmo dia',
      'Sem anúncio e sem estranho na sua porta',
    ],
    botao: 'Quero vender',
    tituloForm: 'Sobre o carro que você quer vender',
    subtituloForm:
      'São quatro campos. O vendedor já abre a conversa sabendo qual é o carro, então ninguém vai te pedir tudo de novo.',
    aviso:
      'A avaliação é feita na loja, com o carro na frente. O valor depende do estado de conservação, e ninguém consegue dizer isso pela internet sem ver.',
    passosTitulo: 'Três passos, e o último é o único que exige sair de casa.',
    passos: [
      {
        titulo: 'Você conta o básico',
        texto: 'Modelo, ano e quilometragem. Não precisa mandar foto nem documento.',
      },
      {
        titulo: 'Fala com um vendedor',
        texto:
          'A conversa já abre com os dados do seu carro escritos. Ninguém vai te pedir tudo de novo.',
      },
      {
        titulo: 'Traz o carro na loja',
        texto:
          'A avaliação é presencial e sai na hora. Se fechar, o pagamento e a documentação saem no mesmo dia.',
      },
    ],
    abertura: 'Olá! Quero vender meu carro e vim pelo site.',
    fecho: 'Pode me passar como funciona a avaliação?',
  },
  {
    valor: 'consignacao',
    // Uma palavra so, pra caber numa linha na metade do bloco no celular:
    // "Deixar em consignação" quebrava em duas e desalinhava os dois lados.
    // Quem nao conhece a palavra le a linha de baixo, que explica.
    rotulo: 'Consignação',
    chamada: 'A loja vende por você',
    resumo: 'Seu carro fica exposto na loja e a venda passa a ser conosco.',
    vantagens: [
      'Seu carro na vitrine da loja e nos nossos anúncios',
      'A gente atende, mostra e negocia no seu lugar',
      'Documentação e pagamento conduzidos pela loja',
    ],
    botao: 'Quero consignar',
    tituloForm: 'Sobre o carro que você quer consignar',
    subtituloForm:
      'São quatro campos. O vendedor já abre a conversa sabendo qual é o carro e te explica as condições da consignação.',
    aviso:
      'Na consignação o carro fica exposto na loja e a venda é feita por nós. Valor, prazo e condições são combinados na hora, com o carro na frente.',
    passosTitulo: 'Três passos. Depois do último, o trabalho é nosso.',
    passos: [
      {
        titulo: 'Você conta o básico',
        texto: 'Modelo, ano e quilometragem. Não precisa mandar foto nem documento.',
      },
      {
        titulo: 'Combina as condições',
        texto:
          'Valor de venda, prazo e condições são acertados com o vendedor antes de qualquer coisa.',
      },
      {
        titulo: 'Deixa o carro na loja',
        texto:
          'A partir daí é com a gente: exposição, anúncio, atendimento, visita e negociação.',
      },
    ],
    abertura: 'Olá! Quero deixar meu carro em consignação e vim pelo site.',
    fecho: 'Pode me explicar como funciona a consignação?',
  },
]

export function opcaoDe(intencao: Intencao): OpcaoVenda {
  return OPCOES_VENDA.find((o) => o.valor === intencao) ?? OPCOES_VENDA[0]
}
