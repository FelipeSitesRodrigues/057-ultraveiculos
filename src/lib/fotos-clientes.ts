import { readdir } from 'node:fs/promises'
import path from 'node:path'

export type FotoCliente = {
  src: string
  nome: string | null
  alt: string
}

const EXTENSOES = new Set(['.webp', '.jpg', '.jpeg', '.png', '.avif'])

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
        nome,
        alt: nome
          ? `${nome}, cliente da Ultra Veículos, com o carro que comprou na loja`
          : 'Cliente da Ultra Veículos com o carro que comprou na loja',
      }
    })
}
