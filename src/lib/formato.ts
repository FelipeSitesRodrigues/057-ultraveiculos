/**
 * Formatacao. Dinheiro sempre vem do banco em centavos, inteiro, e so vira
 * texto aqui. Float em preco de carro sempre acaba em R$ 45.899,99999.
 */

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const BRL_CENTAVOS = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const NUM = new Intl.NumberFormat('pt-BR')

/** R$ 137.990 */
export function reais(centavos: number): string {
  return BRL.format(Math.round(centavos / 100))
}

/** R$ 1.234,56 (para parcela, onde o centavo importa) */
export function reaisExatos(centavos: number): string {
  return BRL_CENTAVOS.format(centavos / 100)
}

/** 40.000 km */
export function km(valor: number | null): string {
  if (valor === null) return 'km não informado'
  return `${NUM.format(valor)} km`
}

/** 2019 ou 2019/2020 quando fabricacao e modelo diferem */
export function ano(fabricacao: number | null, modelo: number | null): string {
  if (!fabricacao && !modelo) return ''
  if (fabricacao && modelo && fabricacao !== modelo) return `${fabricacao}/${modelo}`
  return String(modelo ?? fabricacao)
}

/** "Chevrolet Equinox 2.0 Premier Turbo Awd Aut. 5p" */
export function tituloVeiculo(v: {
  marca: string
  modelo: string
  versao: string
}): string {
  return [v.marca, v.modelo, v.versao].filter(Boolean).join(' ').trim()
}

/**
 * Slug estavel e legivel, com sufixo curto pra nunca colidir.
 * Ex: chevrolet-equinox-2-0-premier-2019-a1b2
 */
export function gerarSlug(
  partes: (string | number | null | undefined)[],
  sufixo: string,
): string {
  const base = partes
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return `${base}-${sufixo}`
}

/** (11) 98140-4811 */
export function telefone(digitos: string): string {
  const d = digitos.replace(/\D/g, '').replace(/^55/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return digitos
}
