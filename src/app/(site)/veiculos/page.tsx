import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { CardVeiculo } from '@/components/CardVeiculo'
import { PainelFiltros } from '@/components/PainelFiltros'
import { BarraEstoque } from '@/components/BarraEstoque'
import { BannerCatalogo } from '@/components/BannerCatalogo'
import {
  buscarBannerDoTopo,
  buscarCatalogo,
  buscarConfig,
  buscarOpcoesDeFiltro,
} from '@/lib/dados'
import type { FiltrosCatalogo as TipoFiltros } from '@/lib/dados'
import { SITE } from '@/lib/site'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Estoque de seminovos em Suzano',
  description: `Veja o estoque completo da ${SITE.nome}: seminovos com procedência conferida, revisados e com pós-venda. Filtre por marca, preço, ano e câmbio.`,
  alternates: { canonical: '/veiculos' },
}

const POR_PAGINA = 12

/**
 * Estrutura da pagina, em duas colunas a partir do desktop:
 *
 *   [ filtros 260px ] [ banner + busca + grid de carros ]
 *
 * A coluna estreita e ferramenta, a larga e produto. O banner mora DENTRO da
 * coluna do produto, e nao no topo da pagina inteira, porque ele fala do
 * estoque, nao da navegacao. No celular vira coluna unica e os filtros viram
 * gaveta, pra lista de carros nao nascer empurrada pra fora da tela.
 */

const ATALHOS = [
  { rotulo: 'Todos', param: {} },
  { rotulo: 'SUVs', param: { carroceria: 'SUV' } },
  { rotulo: 'Sedãs', param: { carroceria: 'Sedã' } },
  { rotulo: 'Hatches', param: { carroceria: 'Hatch' } },
  { rotulo: 'Picapes', param: { carroceria: 'Picape' } },
  { rotulo: 'Automáticos', param: { cambio: 'Automático' } },
] as const

function inteiro(v: string | undefined): number | undefined {
  if (!v) return undefined
  const n = Number.parseInt(v, 10)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function lerFiltros(sp: Record<string, string | string[] | undefined>): TipoFiltros {
  const um = (c: string) => {
    const v = sp[c]
    return Array.isArray(v) ? v[0] : v
  }
  const ordem = um('ordem')
  return {
    busca: um('busca'),
    marcas: (um('marcas') ?? '').split(',').filter(Boolean),
    cambio: um('cambio'),
    combustivel: um('combustivel'),
    carroceria: um('carroceria'),
    precoMin: inteiro(um('precoMin')),
    precoMax: inteiro(um('precoMax')),
    anoMin: inteiro(um('anoMin')),
    anoMax: inteiro(um('anoMax')),
    kmMax: inteiro(um('kmMax')),
    ordem:
      ordem === 'preco-asc' ||
      ordem === 'preco-desc' ||
      ordem === 'km-asc' ||
      ordem === 'ano-desc'
        ? ordem
        : 'recentes',
    pagina: inteiro(um('pagina')) || 1,
    porPagina: POR_PAGINA,
  }
}

export default async function Catalogo({ searchParams }: PageProps<'/veiculos'>) {
  const sp = await searchParams
  const filtros = lerFiltros(sp)

  const [{ veiculos, total }, config, opcoes, banner] = await Promise.all([
    buscarCatalogo(filtros),
    buscarConfig(),
    buscarOpcoesDeFiltro(),
    buscarBannerDoTopo(),
  ])

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA))
  const atual = Math.min(filtros.pagina ?? 1, paginas)

  const comParams = (mudancas: Record<string, string | null>) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === 'string') q.set(k, v)
    }
    for (const [k, v] of Object.entries(mudancas)) {
      if (v === null) q.delete(k)
      else q.set(k, v)
    }
    q.delete('pagina')
    const s = q.toString()
    return s ? `/veiculos?${s}` : '/veiculos'
  }

  const linkPagina = (p: number) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(sp)) {
      if (typeof v === 'string' && k !== 'pagina') q.set(k, v)
    }
    if (p > 1) q.set('pagina', String(p))
    const s = q.toString()
    return s ? `/veiculos?${s}` : '/veiculos'
  }

  const atalhoAtivo = (p: Record<string, string>) => {
    const chaves = Object.keys(p)
    if (chaves.length === 0) {
      return !['carroceria', 'cambio'].some((c) => typeof sp[c] === 'string')
    }
    return chaves.every((c) => sp[c] === p[c])
  }

  return (
    <div className="bg-fundo pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-8 lg:px-8 lg:pt-12">
        <nav aria-label="Você está aqui" className="text-xs text-tinta-fraca">
          <Link href="/" className="hover:text-ultra">
            Início
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-tinta">Estoque</span>
        </nav>

        {/* Titulo a esquerda, apoio a direita: a largura da tela grande vira
            leitura, em vez de virar espaco vazio nas laterais. */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-end lg:gap-10">
          <h1 className="font-display text-3xl uppercase leading-[0.95] text-tinta lg:text-5xl">
            Encontre o seu próximo carro
          </h1>
          <p className="text-sm leading-relaxed text-tinta-fraca">
            Seminovos selecionados e revisados. Filtre por marca, preço e ano. O estoque
            gira rápido, então qualquer dúvida é só chamar no WhatsApp.
          </p>
        </div>

        <div className="trilha -mx-4 mt-7 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
          {ATALHOS.map((a) => {
            const ativo = atalhoAtivo(a.param as Record<string, string>)
            return (
              <Link
                key={a.rotulo}
                href={comParams({
                  carroceria: null,
                  cambio: null,
                  ...(a.param as Record<string, string>),
                })}
                aria-current={ativo ? 'page' : undefined}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  ativo
                    ? 'bg-ultra text-white'
                    : 'border border-linha bg-carta text-tinta hover:border-ultra hover:text-ultra'
                }`}
              >
                {a.rotulo}
              </Link>
            )
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
          <Suspense fallback={<div className="h-12" />}>
            <PainelFiltros opcoes={opcoes} total={total} />
          </Suspense>

          <div className="min-w-0">
            {banner && (
              <div className="mb-6">
                <BannerCatalogo banner={banner} />
              </div>
            )}

            <Suspense fallback={<div className="h-12" />}>
              <BarraEstoque total={total} />
            </Suspense>

            {veiculos.length > 0 ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {veiculos.map((v, i) => (
                  <CardVeiculo
                    key={v.id}
                    veiculo={v}
                    financiamento={config.financiamento}
                    prioridade={i < 3}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-linha bg-carta p-10 text-center">
                <p className="font-display text-xl uppercase text-tinta">
                  Nenhum veículo com esses filtros
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-tinta-fraca">
                  O estoque gira rápido. Tente afrouxar um filtro, ou chame a gente no
                  WhatsApp que procuramos o carro que você quer.
                </p>
                <Link
                  href="/veiculos"
                  className="btn-toque mt-6 inline-flex rounded-full bg-ultra px-6 py-3 text-sm font-semibold text-white hover:bg-ultra-claro"
                >
                  Ver todo o estoque
                </Link>
              </div>
            )}

            {paginas > 1 && (
              <nav
                aria-label="Paginação"
                className="mt-10 flex items-center justify-center gap-2"
              >
                {atual > 1 && (
                  <Link
                    href={linkPagina(atual - 1)}
                    rel="prev"
                    className="btn-toque rounded-full border border-linha bg-carta px-4 py-2.5 text-sm font-medium text-tinta hover:border-ultra hover:text-ultra"
                  >
                    Anterior
                  </Link>
                )}
                <span className="numeros-tabela px-3 text-sm text-tinta-fraca">
                  Página {atual} de {paginas}
                </span>
                {atual < paginas && (
                  <Link
                    href={linkPagina(atual + 1)}
                    rel="next"
                    className="btn-toque rounded-full border border-linha bg-carta px-4 py-2.5 text-sm font-medium text-tinta hover:border-ultra hover:text-ultra"
                  >
                    Próxima
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
