import { criarClientePublico } from '@/lib/supabase/publico'
import type {
  Banner,
  VeiculoPublico,
  VeiculoPublicoComFotos,
  Vendedor,
} from '@/types/database'

/**
 * Todas as leituras do site publico passam por aqui.
 *
 * REGRA QUE NAO SE QUEBRA: nenhuma funcao deste arquivo seleciona
 * `veiculo_financeiro`. Custo e preco minimo nao existem para o visitante,
 * nem por join, nem por select aninhado. O banco ja recusa (a RLS nao tem
 * policy para anon), isto aqui e a segunda barreira.
 */

/** Colunas publicas do veiculo, escritas uma vez e reusadas. */
const CAMPOS_VEICULO = `
  id, slug, status, destaque, premium, ordem,
  marca, modelo, versao, ano_fabricacao, ano_modelo, km,
  preco_centavos, cambio, combustivel, cor, portas, carroceria,
  placa_final, descricao, ficha, opcionais, vendedor_id,
  entrou_em, criado_em, atualizado_em
`

const CAMPOS_FOTO = 'id, veiculo_id, path, ordem, largura, altura, alt'

export type FiltrosCatalogo = {
  busca?: string
  /** Uma ou mais marcas. Vazio significa todas. */
  marcas?: string[]
  cambio?: string
  combustivel?: string
  carroceria?: string
  precoMin?: number
  precoMax?: number
  anoMin?: number
  anoMax?: number
  kmMax?: number
  ordem?: 'recentes' | 'preco-asc' | 'preco-desc' | 'km-asc' | 'ano-desc'
  pagina?: number
  porPagina?: number
}


/**
 * Deixa o texto digitado no mesmo formato da coluna `busca_simples` do banco:
 * sem acento e em minuscula. Sem isto, quem digita "Citroen" nao encontra
 * "Citroën", que foi exatamente o que aconteceu no site.
 */
export function normalizarBusca(t: string): string {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Quebra o que a pessoa digitou em palavras. Cada uma precisa aparecer em
 * algum lugar do texto do carro, em qualquer ordem: assim "city honda" acha
 * o mesmo que "honda city".
 */
export function palavrasDaBusca(termo: string): string[] {
  return normalizarBusca(termo).split(/\s+/).filter(Boolean).slice(0, 6)
}

export async function buscarDestaques(limite = 8): Promise<VeiculoPublicoComFotos[]> {
  const sb = criarClientePublico()
  const { data, error } = await sb
    .from('veiculos')
    .select(`${CAMPOS_VEICULO}, veiculo_fotos(${CAMPOS_FOTO})`)
    .eq('status', 'publicado')
    .order('destaque', { ascending: false })
    .order('ordem', { ascending: true })
    .order('criado_em', { ascending: false })
    .limit(limite)

  if (error) {
    console.error('buscarDestaques', error.message)
    return []
  }
  return (data ?? []) as unknown as VeiculoPublicoComFotos[]
}

export async function buscarCatalogo(filtros: FiltrosCatalogo = {}): Promise<{
  veiculos: VeiculoPublicoComFotos[]
  total: number
}> {
  const sb = criarClientePublico()
  const porPagina = Math.min(filtros.porPagina ?? 12, 48)
  const pagina = Math.max(1, filtros.pagina ?? 1)
  const de = (pagina - 1) * porPagina

  let q = sb
    .from('veiculos')
    .select(`${CAMPOS_VEICULO}, veiculo_fotos(${CAMPOS_FOTO})`, { count: 'exact' })
    .eq('status', 'publicado')

  const palavras = filtros.busca ? palavrasDaBusca(filtros.busca) : []
  for (const palavra of palavras) {
    q = q.ilike('busca_simples', `%${palavra}%`)
  }
  if (filtros.marcas?.length) q = q.in('marca', filtros.marcas)
  if (filtros.cambio) q = q.eq('cambio', filtros.cambio)
  if (filtros.combustivel) q = q.eq('combustivel', filtros.combustivel)
  // "SUV" e familia: o atalho SUVs do catalogo tambem traz os SUV medio,
  // senao o carro cadastrado como medio some justo do botao mais clicado.
  if (filtros.carroceria === 'SUV') q = q.in('carroceria', ['SUV', 'SUV médio'])
  else if (filtros.carroceria) q = q.eq('carroceria', filtros.carroceria)
  if (filtros.precoMin) q = q.gte('preco_centavos', filtros.precoMin)
  if (filtros.precoMax) q = q.lte('preco_centavos', filtros.precoMax)
  if (filtros.anoMin) q = q.gte('ano_modelo', filtros.anoMin)
  if (filtros.anoMax) q = q.lte('ano_modelo', filtros.anoMax)
  if (filtros.kmMax) q = q.lte('km', filtros.kmMax)

  switch (filtros.ordem) {
    case 'preco-asc':
      q = q.order('preco_centavos', { ascending: true })
      break
    case 'preco-desc':
      q = q.order('preco_centavos', { ascending: false })
      break
    case 'km-asc':
      q = q.order('km', { ascending: true, nullsFirst: false })
      break
    case 'ano-desc':
      q = q.order('ano_modelo', { ascending: false, nullsFirst: false })
      break
    default:
      q = q.order('destaque', { ascending: false }).order('criado_em', { ascending: false })
  }

  const { data, error, count } = await q.range(de, de + porPagina - 1)

  if (error) {
    console.error('buscarCatalogo', error.message)
    return { veiculos: [], total: 0 }
  }

  // Segunda tentativa, só quando a primeira não achou nada e havia texto
  // digitado: pergunta ao banco quais carros se PARECEM com o termo. É o que
  // salva quem escreveu "Renaut" ou "citroem". Custa uma consulta extra, mas
  // só no caminho em que a alternativa seria uma tela vazia.
  if ((count ?? 0) === 0 && palavras.length > 0) {
    const parecidos = await buscarPorSemelhanca(filtros.busca!)
    if (parecidos.total > 0) return parecidos
  }

  return {
    veiculos: (data ?? []) as unknown as VeiculoPublicoComFotos[],
    total: count ?? 0,
  }
}

async function buscarPorSemelhanca(termo: string): Promise<{
  veiculos: VeiculoPublicoComFotos[]
  total: number
}> {
  const sb = criarClientePublico()

  const { data: ids, error } = await sb.rpc('veiculos_parecidos', { termo })
  if (error || !ids?.length) return { veiculos: [], total: 0 }

  const lista = (ids as { id: string }[]).map((r) => r.id)

  // Os carros são buscados pela consulta normal, que já respeita a RLS: a
  // função de semelhança só diz QUAIS ids, nunca devolve dado de veículo.
  const { data } = await sb
    .from('veiculos')
    .select(`${CAMPOS_VEICULO}, veiculo_fotos(${CAMPOS_FOTO})`)
    .eq('status', 'publicado')
    .in('id', lista)

  const veiculos = (data ?? []) as unknown as VeiculoPublicoComFotos[]
  // Mantém a ordem de relevância que o banco devolveu.
  veiculos.sort((a, b) => lista.indexOf(a.id) - lista.indexOf(b.id))

  return { veiculos, total: veiculos.length }
}

export async function buscarVeiculoPorSlug(
  slug: string,
): Promise<VeiculoPublicoComFotos | null> {
  const sb = criarClientePublico()
  const { data, error } = await sb
    .from('veiculos')
    .select(`${CAMPOS_VEICULO}, veiculo_fotos(${CAMPOS_FOTO})`)
    .eq('status', 'publicado')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error('buscarVeiculoPorSlug', error.message)
    return null
  }
  return (data as unknown as VeiculoPublicoComFotos) ?? null
}

export async function buscarSlugsPublicados(): Promise<string[]> {
  const sb = criarClientePublico()
  const { data } = await sb.from('veiculos').select('slug').eq('status', 'publicado')
  return (data ?? []).map((v) => v.slug as string)
}

/** Outros carros disponíveis, sem repetir o que a pessoa já está vendo. */
export async function buscarRelacionados(
  idAtual: string,
  limite = 3,
): Promise<VeiculoPublicoComFotos[]> {
  const sb = criarClientePublico()
  const { data } = await sb
    .from('veiculos')
    .select(`${CAMPOS_VEICULO}, veiculo_fotos(${CAMPOS_FOTO})`)
    .eq('status', 'publicado')
    .neq('id', idAtual)
    .order('destaque', { ascending: false })
    .limit(limite)
  return (data ?? []) as unknown as VeiculoPublicoComFotos[]
}

export async function buscarVendedores(): Promise<Vendedor[]> {
  const sb = criarClientePublico()
  const { data } = await sb
    .from('vendedores')
    .select('id, nome, whatsapp, ativo, ordem')
    .eq('ativo', true)
    .order('ordem')
  return (data ?? []) as Vendedor[]
}

/** O banner do topo do catalogo: o ativo de menor ordem que esta na janela. */
export async function buscarBannerDoTopo(): Promise<Banner | null> {
  const sb = criarClientePublico()
  const { data } = await sb
    .from('banners')
    .select('id, titulo, imagem_path, link, ativo, ordem, inicia_em, termina_em')
    .order('ordem')
    .limit(1)
    .maybeSingle()
  return (data as Banner) ?? null
}

export async function buscarBanners(): Promise<Banner[]> {
  const sb = criarClientePublico()
  const { data } = await sb
    .from('banners')
    .select('id, titulo, imagem_path, link, ativo, ordem, inicia_em, termina_em')
    .order('ordem')
  return (data ?? []) as Banner[]
}

export type OpcoesFiltro = {
  /** Toda marca com carro no estoque, com quantos tem de cada. */
  marcas: { nome: string; total: number }[]
  combustiveis: string[]
  carrocerias: string[]
  /** Extremos reais do estoque, pra calibrar os controles deslizantes. */
  precoMin: number
  precoMax: number
  kmMax: number
  anoMin: number
  anoMax: number
}

/**
 * Opcoes de filtro tiradas do estoque real.
 *
 * Os limites dos sliders vem do que existe hoje, e nao de numero redondo
 * escolhido no chute: um controle que vai ate R$ 500 mil numa loja onde o carro
 * mais caro custa 140 mil obriga a pessoa a arrastar por um vazio.
 */
export async function buscarOpcoesDeFiltro(): Promise<OpcoesFiltro> {
  const sb = criarClientePublico()
  const { data } = await sb
    .from('veiculos')
    .select('marca, cambio, combustivel, carroceria, preco_centavos, km, ano_modelo')
    .eq('status', 'publicado')

  const lista = data ?? []
  const anoAtual = new Date().getFullYear()

  const contagem = new Map<string, number>()
  for (const v of lista) {
    const m = v.marca as string
    if (m) contagem.set(m, (contagem.get(m) ?? 0) + 1)
  }

  const unicos = (campo: 'combustivel' | 'carroceria') =>
    Array.from(
      new Set(lista.map((v) => v[campo]).filter((x): x is string => Boolean(x))),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const numeros = (campo: 'preco_centavos' | 'km' | 'ano_modelo') =>
    lista.map((v) => v[campo] as number | null).filter((n): n is number => n !== null)

  const precos = numeros('preco_centavos')
  const kms = numeros('km')
  const anos = numeros('ano_modelo')

  return {
    marcas: Array.from(contagem.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    combustiveis: unicos('combustivel'),
    carrocerias: unicos('carroceria'),
    precoMin: precos.length ? Math.min(...precos) : 0,
    precoMax: precos.length ? Math.max(...precos) : 20_000_000,
    kmMax: kms.length ? Math.max(...kms) : 200_000,
    anoMin: anos.length ? Math.min(...anos) : 2000,
    anoMax: anos.length ? Math.max(...anos) : anoAtual,
  }
}

// ------------------------------------------------------------
// Config da loja
// ------------------------------------------------------------

export type ConfigLoja = {
  nome: string
  cidade: string
  uf: string
  endereco: string
  bairro: string
  cep: string
  telefone: string
  telefone_exibicao: string
}

export type ConfigHorario = { semana: string; sabado: string; domingo: string }
export type ConfigGoogle = { nota: number; avaliacoes: number }
export type ConfigFinanciamento = {
  taxa_am: number
  prazo_max: number
  prazo_padrao: number
  entrada_min_pct: number
  provisorio: boolean
  aviso: string
}

type MapaConfig = {
  loja: ConfigLoja
  horario: ConfigHorario
  google: ConfigGoogle
  financiamento: ConfigFinanciamento
}

/** Valores usados se o banco estiver fora do ar. O site nunca fica sem rodapé. */
const PADRAO: MapaConfig = {
  loja: {
    nome: 'Ultra Veículos',
    cidade: 'Suzano',
    uf: 'SP',
    endereco: 'Rua Benjamin Constant, 1650',
    bairro: 'Centro',
    cep: '08674-178',
    telefone: '1142924502',
    telefone_exibicao: '11 4292-4502',
  },
  horario: { semana: '09:00 as 19:00', sabado: '09:00 as 15:00', domingo: 'Fechado' },
  google: { nota: 4.9, avaliacoes: 362 },
  financiamento: {
    taxa_am: 0.0189,
    prazo_max: 60,
    prazo_padrao: 48,
    entrada_min_pct: 0.2,
    provisorio: true,
    aviso:
      'Valor estimado. Simulação sem compromisso, sujeita a análise de crédito. Não é oferta de crédito.',
  },
}

export async function buscarConfig(): Promise<MapaConfig> {
  const sb = criarClientePublico()
  const { data, error } = await sb.from('config').select('chave, valor')

  if (error || !data) return PADRAO

  const mapa = Object.fromEntries(data.map((c) => [c.chave, c.valor])) as Partial<MapaConfig>
  return {
    loja: { ...PADRAO.loja, ...(mapa.loja ?? {}) },
    horario: { ...PADRAO.horario, ...(mapa.horario ?? {}) },
    google: { ...PADRAO.google, ...(mapa.google ?? {}) },
    financiamento: { ...PADRAO.financiamento, ...(mapa.financiamento ?? {}) },
  }
}

/** URL pública de um arquivo do Storage. */
export function urlDaFoto(path: string, bucket: 'veiculos' | 'banners' | 'clientes' = 'veiculos'): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${base}/storage/v1/object/public/${bucket}/${path}`
}

/** A capa é a foto de ordem menor. Sem foto, devolve null e o card mostra o vazio. */
export function capa(v: VeiculoPublicoComFotos): string | null {
  const fotos = [...(v.veiculo_fotos ?? [])].sort((a, b) => a.ordem - b.ordem)
  return fotos[0] ? urlDaFoto(fotos[0].path) : null
}

export type { VeiculoPublico }
