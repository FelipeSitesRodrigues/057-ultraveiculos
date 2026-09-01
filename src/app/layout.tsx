import type { Metadata } from 'next'
import { Anton, Inter } from 'next/font/google'
import './globals.css'
import { SITE } from '@/lib/site'

// Display condensada e pesada, no espirito do mockup.
const anton = Anton({
  variable: '--fonte-display',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})

const inter = Inter({
  variable: '--fonte-corpo',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.nome} | Seminovos com procedência em ${SITE.cidade}`,
    template: `%s | ${SITE.nome}`,
  },
  description: SITE.descricao,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE.nome,
    title: `${SITE.nome} | Seminovos com procedência em ${SITE.cidade}`,
    description: SITE.descricao,
  },
  robots: { index: true, follow: true },
}

/**
 * Layout raiz enxuto de proposito: so html, body e as fontes.
 *
 * Header e rodape do site vivem em `(site)/layout.tsx`, porque o painel e a
 * tela de login nao podem herda-los. Painel com menu de site em cima e cabecalho
 * duplicado, e o rodape com endereco da loja nao tem o que fazer numa tela de
 * trabalho interno.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      className={`${anton.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-fundo text-tinta">{children}</body>
    </html>
  )
}
