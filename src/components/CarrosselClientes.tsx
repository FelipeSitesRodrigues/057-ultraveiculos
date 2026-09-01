import Image from 'next/image'
import type { FotoCliente } from '@/lib/fotos-clientes'

/**
 * Carrossel continuo com as fotos de quem comprou na loja.
 *
 * Nao usa JavaScript: e CSS puro, a lista duplicada correndo em loop. Isso
 * significa que ele funciona antes mesmo do JS carregar e nao trava a rolagem
 * da pagina no celular. Quem passa o mouse pausa, e quem pediu menos movimento
 * no sistema nao ve animacao nenhuma (regra global de reduced-motion).
 */
export function CarrosselClientes({ fotos }: { fotos: FotoCliente[] }) {
  if (fotos.length === 0) return null

  // Duplicado pro loop fechar sem emenda. aria-hidden na copia pra o leitor
  // de tela nao anunciar tudo duas vezes.
  const duracao = `${Math.max(30, fotos.length * 7)}s`

  return (
    <section id="clientes" aria-labelledby="titulo-clientes" className="bg-escuro py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-ultra-claro">
          <span className="h-px w-8 bg-ultra" />
          Quem já é da Ultra
        </p>
        <h2
          id="titulo-clientes"
          className="mt-3 max-w-2xl font-display text-3xl uppercase leading-tight text-gelo lg:text-5xl"
        >
          Gente de Suzano saindo daqui de <span className="text-ultra-claro">carro novo</span>.
        </h2>
        <p className="mt-2 max-w-xl text-gelo-fraco">
          Cada foto é uma entrega de verdade, feita na porta da loja.
        </p>
      </div>

      <div className="marquee mt-10" style={{ ['--duracao' as string]: duracao }}>
        <ul className="marquee-trilha gap-4 lg:gap-6">
          {[...fotos, ...fotos].map((f, i) => (
            <li
              key={`${f.src}-${i}`}
              aria-hidden={i >= fotos.length}
              className="w-[220px] shrink-0 lg:w-[280px]"
            >
              <figure className="overflow-hidden rounded-2xl border border-white/10 bg-escuro-2">
                <div className="relative aspect-3/4">
                  {/*
                    Carregamento adiantado de proposito. Como a trilha e larga
                    e anda sozinha, quase todo cartao nasce fora da tela, e o
                    carregamento preguiçoso so dispararia quando ele ja
                    estivesse passando: o visitante veria buraco no carrossel.
                    Prioridade baixa pra nao competir com a foto do hero.
                    A copia duplicada fica lazy porque reusa o mesmo arquivo,
                    que a essa altura ja esta em cache.
                  */}
                  <Image
                    src={f.src}
                    alt={i >= fotos.length ? '' : f.alt}
                    fill
                    sizes="(max-width: 1024px) 220px, 280px"
                    loading={i < fotos.length ? 'eager' : 'lazy'}
                    fetchPriority="low"
                    className="object-cover"
                  />
                </div>
                {f.nome && (
                  <figcaption className="px-4 py-3 text-sm text-gelo-fraco">
                    <span className="text-gelo">{f.nome}</span>
                    <span className="mx-1.5" aria-hidden>
                      ·
                    </span>
                    cliente Ultra
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
