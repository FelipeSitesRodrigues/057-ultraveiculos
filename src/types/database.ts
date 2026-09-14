// ============================================================
// Tipos do banco.
//
// A separacao entre VeiculoPublico e VeiculoInterno e uma trava de
// seguranca, nao organizacao de codigo. O site publico so consegue
// receber VeiculoPublico, que nao tem custo nem preco minimo. Se alguem
// tentar passar um dado interno pra um componente publico, o build quebra.
//
// As outras duas travas do mesmo risco:
//   1. veiculo_financeiro e tabela separada, com RLS sem policy para anon
//   2. nenhuma query do site publico faz join com ela
// ============================================================

export type StatusVeiculo =
  | 'rascunho'
  | 'preparacao'
  | 'publicado'
  | 'vendido'
  | 'arquivado'

export type RolePerfil = 'admin' | 'vendedor'

export type OrigemLead =
  | 'site'
  | 'veiculo'
  | 'vender-meu-carro'
  | 'financiamento'

export type Vendedor = {
  id: string
  nome: string
  whatsapp: string
  ativo: boolean
  ordem: number
  /** Contatos recebidos pelo rodizio do site. So o painel le isto. */
  atendimentos?: number
}

export type VeiculoFoto = {
  id: string
  veiculo_id: string
  path: string
  ordem: number
  largura: number | null
  altura: number | null
  alt: string
}

/**
 * O que o site publico pode receber. Nao existe campo de custo aqui,
 * e isso e proposital: o tipo e a terceira trava contra vazar margem.
 */
export type VeiculoPublico = {
  id: string
  slug: string
  status: StatusVeiculo
  destaque: boolean
  premium: boolean
  ordem: number
  marca: string
  modelo: string
  versao: string
  ano_fabricacao: number | null
  ano_modelo: number | null
  km: number | null
  preco_centavos: number
  cambio: string | null
  combustivel: string | null
  cor: string | null
  portas: number | null
  carroceria: string | null
  placa_final: number | null
  descricao: string
  ficha: Record<string, string | number>
  opcionais: string[]
  vendedor_id: string | null
  entrou_em: string
  criado_em: string
  atualizado_em: string
}

export type VeiculoPublicoComFotos = VeiculoPublico & {
  veiculo_fotos: VeiculoFoto[]
}

/**
 * So o painel enxerga isso. Nunca importar em componente de pagina publica.
 */
export type VeiculoFinanceiro = {
  veiculo_id: string
  custo_centavos: number | null
  minimo_centavos: number | null
  atualizado_em: string
  atualizado_por: string | null
}

/**
 * Visao do painel: o veiculo com a parte financeira junto.
 */
export type VeiculoInterno = VeiculoPublico & {
  origem: 'manual' | 'webmotors'
  id_externo: string | null
  criado_por: string | null
  veiculo_financeiro: VeiculoFinanceiro | null
}

export type Banner = {
  id: string
  titulo: string
  imagem_path: string
  link: string | null
  ativo: boolean
  ordem: number
  inicia_em: string | null
  termina_em: string | null
}

export type Lead = {
  id: string
  nome: string
  telefone: string
  mensagem: string
  veiculo_id: string | null
  vendedor_id: string | null
  origem: OrigemLead
  atendido: boolean
  criado_em: string
  veiculos?: {
    marca: string
    modelo: string
    versao: string
    ano_modelo: number | null
    slug: string
    status: string
  } | null
  vendedores?: { nome: string } | null
}

export type Perfil = {
  id: string
  nome: string
  role: RolePerfil
  ativo: boolean
}

// ------------------------------------------------------------
// Calculos derivados. Desconto e lucro nao sao colunas no banco,
// pra nunca desincronizar do preco.
// ------------------------------------------------------------

export function descontoMaximo(
  precoCentavos: number,
  minimoCentavos: number | null,
): number | null {
  if (minimoCentavos === null) return null
  return Math.max(0, precoCentavos - minimoCentavos)
}

export function lucroPrevisto(
  precoCentavos: number,
  custoCentavos: number | null,
): number | null {
  if (custoCentavos === null) return null
  return precoCentavos - custoCentavos
}

export function diasNoEstoque(entrouEm: string, hoje = new Date()): number {
  const entrada = new Date(`${entrouEm}T00:00:00`)
  const ms = hoje.getTime() - entrada.getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}
