import { criarClientePublico } from '@/lib/supabase/publico'
import { urlDaFoto } from '@/lib/dados'

export type FotoCliente = {
  id: string
  /** Caminho dentro do bucket `clientes`. */
  path: string
  src: string
  /** Exibir invertida horizontalmente, pra o carro apontar pro mesmo lado das outras. */
  espelhada: boolean
  ordem: number
}

/**
 * As fotos do carrossel "Quem ja e da Ultra", na ordem do painel.
 *
 * Quem sobe, ordena, espelha e remove e o proprio Pietro, em /painel/clientes.
 * O espelho e so exibicao (scaleX(-1) no CSS): o arquivo no bucket continua o
 * original, entao desfazer nunca perde qualidade.
 *
 * Se o banco nao responder, devolve lista vazia e a secao some da home em vez
 * de quebrar a pagina inteira.
 */
export async function lerFotosDeClientes(): Promise<FotoCliente[]> {
  const sb = criarClientePublico()
  const { data, error } = await sb
    .from('fotos_clientes')
    .select('id, path, espelhada, ordem')
    .order('ordem')
    .order('criado_em')

  if (error || !data) return []

  return data.map((f) => ({ ...f, src: urlDaFoto(f.path, 'clientes') }))
}
