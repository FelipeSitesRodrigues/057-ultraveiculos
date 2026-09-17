/**
 * Redimensiona e converte a imagem usando o canvas do proprio navegador.
 *
 * Uma foto de celular de 4 MB vira uns 150 a 300 KB antes de subir, entao o
 * envio no 4G da loja fica em segundos e nao gasta o pacote de dados de quem
 * esta cadastrando. Usado pelas fotos de veiculo, fotos de cliente e banner.
 *
 * O Safari (todo iPhone, e o Mac tambem) NAO gera webp no canvas: pede webp e
 * devolve PNG sem compressao. Foi assim que 197 fotos de carro subiram com ate
 * 3 MB cada, com nome .webp, ate 2026-09-17. Quando o navegador nao entrega
 * webp, a foto sai em JPEG, que todos geram, e a extensao acompanha o formato.
 */
export type ImagemPronta = { blob: Blob; extensao: 'webp' | 'jpg' }

export async function prepararImagem(
  arquivo: File,
  larguraMax: number,
  alturaMax: number,
  qualidade = 0.82,
): Promise<ImagemPronta> {
  const bitmap = await createImageBitmap(arquivo)

  const escala = Math.min(1, larguraMax / bitmap.width, alturaMax / bitmap.height)
  const largura = Math.round(bitmap.width * escala)
  const altura = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas indisponível')
  ctx.drawImage(bitmap, 0, 0, largura, altura)
  bitmap.close()

  const webp = await gerar(canvas, 'image/webp', qualidade)
  if (webp.type === 'image/webp') return { blob: webp, extensao: 'webp' }
  return { blob: await gerar(canvas, 'image/jpeg', qualidade), extensao: 'jpg' }
}

async function gerar(canvas: HTMLCanvasElement, tipo: string, qualidade: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, qualidade))
  if (!blob) throw new Error('não consegui converter a imagem')
  return blob
}
