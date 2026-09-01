import { criarClienteServidor } from '@/lib/supabase/servidor'
import type { Lead, VeiculoInterno, Vendedor } from '@/types/database'

/**
 * Leituras do painel. Diferente de `dados.ts`, aqui a sessao existe e a
 * consulta PODE tocar `veiculo_financeiro`.
 *
 * Nada deste arquivo pode ser importado por pagina publica.
 */

const CAMPOS = `
  id, slug, status, destaque, premium, ordem,
  marca, modelo, versao, ano_fabricacao, ano_modelo, km,
  preco_centavos, cambio, combustivel, cor, portas, carroceria,
  placa_final, descricao, ficha, opcionais, vendedor_id,
  origem, id_externo, entrou_em, criado_em, atualizado_em, criado_por
`

export type FiltroPainel =
  | 'todos'
  | 'publicado'
  | 'rascunho'
  | 'girar'
  | 'vendido'
  | 'arquivado'

export async function listarVeiculos(filtro: FiltroPainel = 'todos', busca = '') {
  const sb = await criarClienteServidor()

  let q = sb
    .from('veiculos')
    .select(`${CAMPOS}, veiculo_financeiro(*), veiculo_fotos(id, path, ordem)`)
    .order('criado_em', { ascending: false })

  if (filtro === 'girar') {
    // Parado ha mais de 90 dias e ainda no ar: e o que precisa de atencao.
    const limite = new Date()
    limite.setDate(limite.getDate() - 90)
    q = q.eq('status', 'publicado').lte('entrou_em', limite.toISOString().slice(0, 10))
  } else if (filtro !== 'todos') {
    q = q.eq('status', filtro)
  } else {
    q = q.neq('status', 'arquivado')
  }

  if (busca.trim()) {
    const t = busca.trim()
    q = q.or(`marca.ilike.%${t}%,modelo.ilike.%${t}%,versao.ilike.%${t}%,cor.ilike.%${t}%`)
  }

  const { data, error } = await q
  if (error) {
    console.error('listarVeiculos', error.message)
    return []
  }
  return (data ?? []) as unknown as (VeiculoInterno & {
    veiculo_fotos: { id: string; path: string; ordem: number }[]
  })[]
}

export async function buscarVeiculoPorId(id: string) {
  const sb = await criarClienteServidor()
  const { data } = await sb
    .from('veiculos')
    .select(`${CAMPOS}, veiculo_financeiro(*), veiculo_fotos(id, veiculo_id, path, ordem, largura, altura, alt)`)
    .eq('id', id)
    .maybeSingle()
  return (data as unknown as VeiculoInterno & {
    veiculo_fotos: {
      id: string
      veiculo_id: string
      path: string
      ordem: number
      largura: number | null
      altura: number | null
      alt: string
    }[]
  }) ?? null
}

export async function listarVendedoresPainel(): Promise<Vendedor[]> {
  const sb = await criarClienteServidor()
  const { data } = await sb
    .from('vendedores')
    .select('id, nome, whatsapp, ativo, ordem, atendimentos')
    .order('ordem')
  return (data ?? []) as Vendedor[]
}

export async function listarLeads(): Promise<Lead[]> {
  const sb = await criarClienteServidor()
  const { data } = await sb
    .from('leads')
    .select('id, nome, telefone, mensagem, veiculo_id, origem, atendido, criado_em')
    .order('criado_em', { ascending: false })
    .limit(200)
  return (data ?? []) as Lead[]
}

export type Resumo = {
  disponiveis: number
  valorMercado: number
  patrimonio: number
  semMargem: number
  emPreparacao: number
  paradosMais90: number
  leadsNovos: number
}

/** Os numeros da visao geral. Todos saem do estoque, nenhum depende de CRM. */
export async function resumoDaLoja(): Promise<Resumo> {
  const sb = await criarClienteServidor()

  const [{ data: veiculos }, { count: leadsNovos }] = await Promise.all([
    sb.from('veiculos').select('status, preco_centavos, entrou_em, veiculo_financeiro(custo_centavos, minimo_centavos)'),
    sb.from('leads').select('id', { count: 'exact', head: true }).eq('atendido', false),
  ])

  const lista = (veiculos ?? []) as unknown as {
    status: string
    preco_centavos: number
    entrou_em: string
    veiculo_financeiro: { custo_centavos: number | null; minimo_centavos: number | null } | null
  }[]

  const publicados = lista.filter((v) => v.status === 'publicado')
  const limite = new Date()
  limite.setDate(limite.getDate() - 90)

  return {
    disponiveis: publicados.length,
    valorMercado: publicados.reduce((s, v) => s + v.preco_centavos, 0),
    patrimonio: lista
      .filter((v) => v.status !== 'vendido' && v.status !== 'arquivado')
      .reduce((s, v) => s + (v.veiculo_financeiro?.custo_centavos ?? 0), 0),
    semMargem: lista.filter(
      (v) =>
        v.status !== 'vendido' &&
        v.status !== 'arquivado' &&
        (v.veiculo_financeiro?.minimo_centavos == null ||
          v.veiculo_financeiro?.custo_centavos == null),
    ).length,
    emPreparacao: lista.filter((v) => v.status === 'preparacao').length,
    paradosMais90: publicados.filter((v) => new Date(v.entrou_em) <= limite).length,
    leadsNovos: leadsNovos ?? 0,
  }
}

/** Limite de carros que podem aparecer na primeira parte da home. */
export const MAX_DESTAQUES = 8

/**
 * Quantos slots de destaque estao ocupados AGORA.
 *
 * Conta o estoque inteiro, nao a lista filtrada da tela: o limite e global, e
 * mostrar "3 de 8" com base no filtro aberto faria a conta mudar sozinha
 * quando a pessoa trocasse de aba.
 */
export async function contarDestaques(): Promise<number> {
  const sb = await criarClienteServidor()
  const { count, error } = await sb
    .from('veiculos')
    .select('id', { count: 'exact', head: true })
    .eq('destaque', true)
    .eq('status', 'publicado')

  if (error) {
    console.error('contarDestaques', error.message)
    return 0
  }
  return count ?? 0
}
