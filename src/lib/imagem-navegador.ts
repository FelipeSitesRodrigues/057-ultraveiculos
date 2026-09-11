/**
 * Redimensiona e converte pra webp usando o canvas do proprio navegador.
 *
 * Uma foto de celular de 4 MB vira uns 150 a 300 KB antes de subir, entao o
 * envio no 4G da loja fica em segundos e nao gasta o pacote de dados de quem
 * esta cadastrando. Usado pelas fotos de veiculo e pelas fotos de cliente.
 */
export async function prepararImagem(
  arquivo: File,
  larguraMax: number,
  alturaMax: number,
  qualidade = 0.82,
): Promise<Blob> {
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

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', qualidade),
  )
  if (!blob) throw new Error('não consegui converter a imagem')
  return blob
}
