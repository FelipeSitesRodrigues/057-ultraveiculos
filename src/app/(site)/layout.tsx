import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { buscarConfig, buscarVendedores } from '@/lib/dados'

/**
 * Layout das paginas publicas: header, rodape e o link de pular pro conteudo.
 * O painel e a tela de login ficam fora deste grupo e nao herdam nada disso.
 */
export default async function LayoutSite({ children }: LayoutProps<'/'>) {
  const [config, vendedores] = await Promise.all([buscarConfig(), buscarVendedores()])

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-ultra focus:px-4 focus:py-2 focus:text-white"
      >
        Ir para o conteúdo
      </a>
      <Header vendedores={vendedores} />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <Footer config={config} vendedores={vendedores} />
    </>
  )
}
