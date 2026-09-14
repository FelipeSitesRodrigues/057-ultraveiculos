/**
 * Constantes do site que nao mudam pelo painel.
 * O que o cliente edita (endereco, horario, taxa do simulador) vem da
 * tabela `config` do banco, nao daqui. Aqui fica so o que e estrutural.
 */

export const SITE = {
  nome: 'Ultra Veículos',
  nomeCurto: 'Ultra',
  cidade: 'Suzano',
  uf: 'SP',
  descricao:
    'Seminovos com procedência conferida, revisados antes de sair da loja e pós-venda que atende de verdade. Ultra Veículos, em Suzano, São Paulo.',
  // Trocar quando o domínio estiver registrado.
  url: 'https://ultraveiculos.com.br',
  instagram: '',
} as const

/**
 * Menu do site. So entra item que leva a algum lugar que existe.
 * As ancoras (#) apontam pras secoes da home; a partir de outra pagina, o
 * link volta pra home e rola ate la.
 */
export const ROTAS = [
  { href: '/', rotulo: 'Início' },
  { href: '/veiculos', rotulo: 'Estoque' },
  { href: '/venda-seu-carro', rotulo: 'Venda seu carro' },
  { href: '/#clientes', rotulo: 'Clientes' },
  { href: '/#avaliacoes', rotulo: 'Avaliações' },
  { href: '/#contato', rotulo: 'Contato' },
] as const

/**
 * Monta link de WhatsApp com a mensagem já preenchida.
 * Padrão da Tork: todo botão de contato chega com contexto escrito,
 * pra pessoa não precisar explicar de onde veio.
 */
export function linkWhatsApp(numero: string, mensagem: string): string {
  const limpo = numero.replace(/\D/g, '')
  return `https://wa.me/${limpo}?text=${encodeURIComponent(mensagem)}`
}

export function mensagemVeiculo(titulo: string, preco: string): string {
  return `Olá! Vim pelo site e tenho interesse no *${titulo}* (${preco}). Ele ainda está disponível?`
}

/** De onde veio o contato. Os valores sao os que a tabela `leads` aceita. */
export const ORIGENS_CONTATO = ['site', 'veiculo', 'vender-meu-carro', 'financiamento'] as const
export type OrigemContato = (typeof ORIGENS_CONTATO)[number]

export const ROTULO_ORIGEM: Record<OrigemContato, string> = {
  site: 'Botão do site',
  veiculo: 'Página do carro',
  financiamento: 'Simulador de parcela',
  'vender-meu-carro': 'Venda seu carro',
}

/**
 * Coloca o nome da pessoa na abertura da mensagem, pro vendedor ja chamar
 * pelo nome. "Meu nome é" e nao "sou o/a": o site nao sabe o genero de quem
 * escreve.
 */
export function mensagemComNome(mensagem: string, nome: string): string {
  const apresentacao = `Olá! Meu nome é ${nome}.`
  return mensagem.startsWith('Olá!')
    ? `${apresentacao}${mensagem.slice('Olá!'.length)}`
    : `${apresentacao} ${mensagem}`
}

export const MENSAGEM_GERAL =
  'Olá! Vim pelo site da Ultra Veículos e gostaria de falar com um vendedor.'

export const MENSAGEM_AVALIACAO =
  'Olá! Vim pelo site e quero uma avaliação do meu carro para troca.'
