import type { Metadata } from 'next'
import { VendaSeuCarro } from '@/components/VendaSeuCarro'
import { buscarVendedores } from '@/lib/dados'
import { SITE } from '@/lib/site'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Venda ou consigne seu carro em Suzano',
  description: `Quer vender ou deixar seu carro em consignação? A ${SITE.nome} compra o seu carro à vista ou vende por você, em ${SITE.cidade}. Diga o modelo, o ano e a quilometragem e fale com um vendedor pelo WhatsApp.`,
  alternates: { canonical: '/venda-seu-carro' },
}

/**
 * A pagina tem dois caminhos (vender e consignar) e a escolha entre eles muda
 * quase todo o texto, entao o conteudo vive num componente de cliente. Aqui
 * fica so o que precisa do servidor: os metadados e o vendedor da vez.
 */
export default async function PaginaVendaSeuCarro() {
  const vendedores = await buscarVendedores()

  // O contato entra no rodízio: a rota /atendimento escolhe o vendedor da vez
  // no momento do clique.
  const base = vendedores.length > 0 ? '/atendimento?msg=' : ''

  return <VendaSeuCarro whatsUrlBase={base} />
}
