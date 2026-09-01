import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { sessaoDaEquipe } from '@/lib/supabase/servidor'
import { sair } from '@/app/painel/acoes'

export const metadata: Metadata = {
  title: 'Painel',
  robots: { index: false, follow: false },
}

// O painel nunca e cacheado: mostra dado que muda a cada salvamento.
export const dynamic = 'force-dynamic'

const ABAS = [
  { href: '/painel', rotulo: 'Visão geral' },
  { href: '/painel/veiculos', rotulo: 'Estoque' },
  { href: '/painel/leads', rotulo: 'Contatos' },
  { href: '/painel/banner', rotulo: 'Banner' },
] as const

export default async function LayoutPainel({ children }: LayoutProps<'/painel'>) {
  // Segunda barreira: o proxy ja barrou quem nao tem sessao, mas ele nao
  // checa perfil ativo, e proxy sozinho nunca e controle de acesso.
  const sessao = await sessaoDaEquipe()
  if (!sessao) redirect('/entrar?destino=/painel')

  return (
    <div className="min-h-screen bg-fundo">
      <header className="border-b border-ultra/30 bg-escuro">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/painel" className="flex items-center gap-3">
              <Image
                src="/img/logo.webp"
                alt="Ultra Veículos"
                width={720}
                height={486}
                className="h-9 w-auto"
              />
              <span className="hidden text-xs font-semibold uppercase tracking-widest text-gelo-fraco sm:inline">
                Painel
              </span>
            </Link>

            <nav aria-label="Painel">
              <ul className="flex items-center gap-1">
                {ABAS.map((a) => (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      className="rounded-full px-3.5 py-2 text-sm font-medium text-gelo transition hover:bg-white/10"
                    >
                      {a.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-sm text-gelo-fraco transition hover:text-ultra-claro"
            >
              Ver o site
            </Link>
            <span className="hidden text-sm text-gelo-fraco sm:inline">{sessao.nome}</span>
            <form action={sair}>
              <button
                type="submit"
                className="btn-toque rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-gelo hover:border-ultra hover:text-ultra-claro"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-10">{children}</main>
    </div>
  )
}
