import Link from 'next/link'
import { ArteDeFundo } from '@/components/ArteDeFundo'
import type { Vendedor } from '@/types/database'
import { BotaoWhats } from '@/components/BotaoWhats'
import { MENSAGEM_GERAL } from '@/lib/site'

/**
 * Hero com a foto ocupando o fundo inteiro, no celular e no desktop.
 *
 * A imagem do celular e uma versao em retrato, gerada no mesmo chat do
 * mockup, entao ela preenche a tela vertical sem precisar de corte agressivo.
 * O texto pousa por cima, na parte de baixo no celular e na esquerda no
 * desktop, sempre sobre a area escura da foto.
 */
export function Hero({ vendedores }: { vendedores: Vendedor[] }) {
  return (
    <section className="corte-raio relative isolate flex min-h-[88svh] items-end overflow-hidden bg-escuro lg:min-h-[680px] lg:items-center">
      {/* Fundo */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <ArteDeFundo
          celular="/img/hero-mobile"
          desktop="/img/hero-desktop"
          className="object-center lg:object-[center_45%]"
        />
        {/* Veu: no celular escurece de baixo pra cima, que e onde o texto
            pousa. No desktop escurece da esquerda pra direita. */}
        <div className="absolute inset-0 bg-gradient-to-t from-escuro via-escuro/70 to-escuro/20 lg:bg-gradient-to-r lg:from-escuro lg:via-escuro/70 lg:to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-32 lg:px-8 lg:py-32">
        <div className="max-w-2xl">
          <p className="revela flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-gelo-fraco">
            <span className="h-px w-10 bg-ultra" />
            Seminovos com procedência
          </p>

          <h1 className="revela revela-1 mt-4 font-display text-4xl uppercase leading-[0.95] text-gelo sm:text-5xl lg:text-7xl">
            O carro certo para a sua <span className="text-ultra">próxima</span> escolha.
          </h1>

          <p className="revela revela-2 mt-5 max-w-md text-base leading-relaxed text-gelo-fraco lg:text-lg">
            Carros revisados antes de sair da loja e um pós-venda que atende de verdade.
            Confiança que você sente na prática.
          </p>

          <div className="revela revela-3 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/veiculos"
              className="btn-toque inline-flex items-center justify-center gap-2 rounded-full bg-ultra px-7 py-3.5 font-semibold text-white hover:bg-ultra-claro"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-5"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              Ver estoque
            </Link>
            <BotaoWhats
              vendedores={vendedores}
              mensagem={MENSAGEM_GERAL}
              className="btn-toque px-7 py-3.5"
              classeWrapper="w-full sm:w-auto"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
