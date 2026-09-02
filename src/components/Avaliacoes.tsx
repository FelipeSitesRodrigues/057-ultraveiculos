'use client'

import { useRef } from 'react'
import { AVALIACOES } from '@/lib/avaliacoes'

/** Logo oficial do Google, nas quatro cores. */
function LogoGoogle({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={className}>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  )
}

/** O degrade fica no documento uma vez so: id repetido e HTML invalido. */
function DegradeOuro() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <defs>
        <linearGradient id="ouro-estrela" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-ouro-claro)" />
          <stop offset="45%" stopColor="var(--color-ouro)" />
          <stop offset="100%" stopColor="var(--color-ouro-sombra)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/**
 * As cinco estrelas da secao.
 *
 * SVG e nao o caractere ★: no tamanho grande que o cliente pediu, o glifo sai
 * fino, com desenho diferente em cada fonte e espacamento irregular. Em SVG o
 * desenho e sempre o mesmo e a cor e controlada.
 *
 * O ouro e um degrade VERTICAL (claro em cima, escuro embaixo) e nao o
 * `.ouro` do resto do site, que tem um brilho quase branco no meio: sobre o
 * fundo off-white desta secao, aquele brilho sumiria justo no miolo da estrela
 * e o efeito seria o contrario do pedido. Aqui a maior parte da estrela fica
 * nos tons escuros do ouro, que e o que da contraste contra o claro.
 *
 * Sem texto alternativo de proposito: o titulo ao lado ja diz o que as
 * estrelas significam, e um rotulo aqui repetiria a mesma frase pra quem usa
 * leitor de tela.
 */
function CincoEstrelas({ className = '', tamanho = 'size-7 lg:size-8' }) {
  return (
    <span aria-hidden className={`flex gap-1 ${className}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          fill="url(#ouro-estrela)"
          className={`${tamanho} drop-shadow-[0_1px_1px_rgb(0_0_0_/_0.18)]`}
        >
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </span>
  )
}

function Seta({ direita = false }: { direita?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      className={`size-5 ${direita ? '' : 'rotate-180'}`}
    >
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Avaliacoes() {
  const trilha = useRef<HTMLUListElement>(null)

  const rolar = (dir: 1 | -1) => {
    const el = trilha.current
    if (!el) return
    // Anda um cartao por clique, seja qual for a largura da tela.
    const passo = el.querySelector('li')?.clientWidth ?? 320
    el.scrollBy({ left: dir * (passo + 24), behavior: 'smooth' })
  }

  return (
    <section id="avaliacoes" aria-labelledby="titulo-avaliacoes" className="bg-fundo py-12 lg:py-16">
      <DegradeOuro />
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <LogoGoogle className="size-11 shrink-0" />
            <div>
              <h2
                id="titulo-avaliacoes"
                className="font-display text-2xl uppercase leading-tight text-tinta lg:text-3xl"
              >
                A loja mais bem avaliada da <span className="text-ultra">região</span>.
              </h2>
              <CincoEstrelas className="mt-2" />
            </div>
          </div>

          {/* Setas so no desktop: no celular a pessoa arrasta com o dedo. */}
          <div className="hidden gap-2 lg:flex">
            <button
              type="button"
              onClick={() => rolar(-1)}
              aria-label="Ver avaliações anteriores"
              className="btn-toque flex size-11 items-center justify-center rounded-full border border-tinta/15 text-tinta hover:border-ultra hover:text-ultra"
            >
              <Seta />
            </button>
            <button
              type="button"
              onClick={() => rolar(1)}
              aria-label="Ver próximas avaliações"
              className="btn-toque flex size-11 items-center justify-center rounded-full border border-tinta/15 text-tinta hover:border-ultra hover:text-ultra"
            >
              <Seta direita />
            </button>
          </div>
        </div>
      </div>

      {/* Trilha arrastavel. Uma linha so, pra secao nao virar rolagem longa. */}
      <ul
        ref={trilha}
        className="trilha mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-2 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]"
      >
        {AVALIACOES.map((a) => (
          <li
            key={a.nome}
            className="w-[85vw] shrink-0 snap-start sm:w-[380px] lg:w-[420px]"
          >
            <figure className="flex h-full flex-col rounded-2xl border border-linha bg-carta p-6">
              <div className="flex items-center justify-between gap-3">
                <CincoEstrelas tamanho="size-4" />
                <LogoGoogle className="size-5 opacity-70" />
              </div>

              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-tinta">
                {a.texto}
              </blockquote>

              <figcaption className="mt-5 border-t border-linha pt-4">
                <p className="font-display text-sm uppercase text-tinta">{a.nome}</p>
                <p className="text-xs text-tinta-fraca">
                  {a.quando}
                  {a.vendedor && (
                    <>
                      <span className="mx-1.5" aria-hidden>
                        ·
                      </span>
                      atendido por {a.vendedor}
                    </>
                  )}
                </p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
