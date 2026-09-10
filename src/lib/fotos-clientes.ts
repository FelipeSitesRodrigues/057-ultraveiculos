import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { criarClientePublico } from '@/lib/supabase/publico'

export type FotoCliente = {
  src: string
  /** Nome do arquivo. E a chave que o painel usa pra marcar o espelho. */
  arquivo: string
  nome: string | null
  alt: string
  /** Exibir invertida horizontalmente, pra o carro apontar pro mesmo lado das outras. */
  espelhada: boolean
}

const EXTENSOES = new Set(['.webp', '.jpg', '.jpeg', '.png', '.avif'])

/** Chave da tabela `config` onde fica a lista de arquivos espelhados. */
export const CHAVE_CONFIG = 'fotos_clientes'

/**
 * Quais fotos o site mostra invertidas.
 *
 * O espelho e estado no banco, nao edicao de arquivo: assim o Pietro marca e
 * desmarca no painel sem perder qualidade e sem inverter de vez o logo da
 * plaquinha da Ultra quando ela aparece na foto.
 *
 * Se o banco estiver fora do ar, ninguem espelha e o carrossel aparece do
 * mesmo jeito. Foto torta e menos grave que secao vazia.
 */
export async function lerEspelhadas(): Promise<Set<string>> {
  const sb = criarClientePublico()
  const { data } = await sb
    .from('config')
    .select('valor')
    .eq('chave', CHAVE_CONFIG)
    .maybeSingle()

  const lista = (data?.valor as { espelhadas?: unknown } | null)?.espelhadas
  if (!Array.isArray(lista)) return new Set()
  return new Set(lista.filter((a): a is string => typeof a === 'string'))
}

/**
 * Le `public/img/clientes` e devolve as fotos na ordem alfabetica do arquivo.
 *
 * Feito assim de proposito: o Felipe joga as fotos na pasta e elas aparecem,
 * sem editar codigo nem manter lista nenhuma. Numerar o arquivo controla a
 * ordem (01-, 02-), e o nome depois do numero vira a legenda.
 *
 * Quando o painel existir, isso migra pro Storage do Supabase pra o Leandro
 * poder trocar sozinho. Por enquanto e pasta, que resolve hoje.
 */
export async function lerFotosDeClientes(): Promise<FotoCliente[]> {
  const pasta = path.join(process.cwd(), 'public', 'img', 'clientes')

  let arquivos: string[]
  try {
    arquivos = await readdir(pasta)
  } catch {
    return []
  }

  const espelhadas = await lerEspelhadas()

  return arquivos
    .filter((a) => EXTENSOES.has(path.extname(a).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }))
    .map((arquivo) => {
      const semExt = path.basename(arquivo, path.extname(arquivo))
      // "03-sheila" vira "Sheila". "03" sozinho nao vira legenda nenhuma.
      const cru = semExt.replace(/^\d+[-_\s]*/, '').replace(/[-_]+/g, ' ').trim()
      const nome = cru
        ? cru
            .split(' ')
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(' ')
        : null

      return {
        src: `/img/clientes/${arquivo}`,
        arquivo,
        nome,
        alt: nome
          ? `${nome}, cliente da Ultra Veículos, com o carro que comprou na loja`
          : 'Cliente da Ultra Veículos com o carro que comprou na loja',
        espelhada: espelhadas.has(arquivo),
      }
    })
}
