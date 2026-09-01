'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Vendedor } from '@/types/database'
import { ROTAS, MENSAGEM_GERAL } from '@/lib/site'
import { BotaoWhats } from '@/components/BotaoWhats'
import { BuscaRapida } from '@/components/BuscaRapida'

type Props = {
  vendedores: Vendedor[]
}

export function Header({ vendedores }: Props) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [rolou, setRolou] = useState(false)
  const caminho = usePathname()

  // Paginas com hero escuro de fundo inteiro deixam o header flutuar por cima.
  // Nas outras ele ja nasce solido, senao o texto claro cai sobre fundo claro.
  const sobreHero = caminho === '/'
  const transparente = sobreHero && !rolou && !menuAberto

  useEffect(() => {
    if (!sobreHero) return
    const aoRolar = () => setRolou(window.scrollY > 24)
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => window.removeEventListener('scroll', aoRolar)
  }, [sobreHero])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
          transparente
            ? 'border-b border-transparent bg-transparent'
            : 'border-b border-ultra/40 bg-escuro/95 backdrop-blur'
        }`}
      >
        {/* Sombra suave no topo quando transparente, pra garantir leitura do
            menu sobre a foto sem precisar de barra sólida. */}
        {transparente && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-black/70 to-transparent"
          />
        )}

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 lg:px-8">
          <Link href="/" className="shrink-0" aria-label="Ultra Veículos, página inicial">
            <Image
              src="/img/logo.webp"
              alt="Ultra Veículos"
              width={720}
              height={486}
              priority
              className="h-10 w-auto lg:h-12"
            />
          </Link>

          <nav aria-label="Principal" className="hidden lg:block">
            <ul className="flex items-center gap-6">
              {ROTAS.map((r) => {
                const ativo = r.href === '/' ? caminho === '/' : caminho.startsWith(r.href)
                return (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      aria-current={ativo ? 'page' : undefined}
                      className={`text-sm transition ${
                        ativo ? 'text-ultra-claro' : 'text-gelo hover:text-ultra-claro'
                      }`}
                    >
                      {r.rotulo}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Só lupa e WhatsApp. O telefone e o horário saíram daqui (decisão
              do Felipe em 2026-08-30): continuam no rodapé, onde quem procura
              endereço e horário já vai olhar, e o topo fica com uma ação só. */}
          <div className="hidden items-center gap-3 lg:flex">
            <BuscaRapida />

            <BotaoWhats
              vendedores={vendedores}
              mensagem={MENSAGEM_GERAL}
              rotulo="WhatsApp"
              className="px-5 py-2.5 text-sm"
              classeWrapper="w-auto"
            />
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <BuscaRapida />
            <button
              type="button"
              className="text-gelo"
              aria-expanded={menuAberto}
              aria-controls="menu-mobile"
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setMenuAberto((v) => !v)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-7"
              >
                {menuAberto ? (
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuAberto && (
          <div id="menu-mobile" className="border-t border-white/10 bg-escuro lg:hidden">
            <nav aria-label="Principal, celular" className="mx-auto max-w-7xl px-4 py-4">
              <ul className="flex flex-col">
                {ROTAS.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      onClick={() => setMenuAberto(false)}
                      className="block border-b border-white/5 py-3 text-gelo"
                    >
                      {r.rotulo}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <BotaoWhats vendedores={vendedores} mensagem={MENSAGEM_GERAL} classeWrapper="w-full" />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* O header e fixo, entao fora da home ele precisa de um espacador
          do mesmo tamanho pra nao cobrir o comeco do conteudo. Na home nao:
          la ele flutua por cima do hero de proposito. */}
      {!sobreHero && <div aria-hidden className="h-[68px] lg:h-[78px]" />}
    </>
  )
}
