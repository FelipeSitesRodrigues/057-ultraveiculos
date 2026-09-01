import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GaleriaVeiculo } from '@/components/GaleriaVeiculo'
import { SimuladorParcela } from '@/components/SimuladorParcela'
import { CardVeiculo } from '@/components/CardVeiculo'
import { BotaoWhats } from '@/components/BotaoWhats'
import {
  buscarConfig,
  buscarRelacionados,
  buscarSlugsPublicados,
  buscarVeiculoPorSlug,
  buscarVendedores,
  capa,
} from '@/lib/dados'
import { ano, km, reais, tituloVeiculo } from '@/lib/formato'
import { linkWhatsApp, mensagemVeiculo, SITE } from '@/lib/site'

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await buscarSlugsPublicados()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: PageProps<'/veiculos/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const v = await buscarVeiculoPorSlug(slug)
  if (!v) return { title: 'Veículo não encontrado' }

  const titulo = tituloVeiculo(v)
  const foto = capa(v)
  return {
    title: `${titulo} ${v.ano_modelo ?? ''}`.trim(),
    description: `${titulo} por ${reais(v.preco_centavos)} na ${SITE.nome}, em ${SITE.cidade}. ${km(v.km)}, ${v.cambio ?? ''}. Procedência conferida e revisado antes da entrega.`,
    alternates: { canonical: `/veiculos/${slug}` },
    openGraph: foto ? { images: [{ url: foto }] } : undefined,
  }
}

/** Campo vazio nao vira "nao informado" na tela: ele simplesmente nao aparece. */
function Spec({ rotulo, valor }: { rotulo: string; valor: string | null }) {
  if (!valor) return null
  return (
    <div className="rounded-xl border border-linha bg-fundo p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-tinta-fraca">
        {rotulo}
      </dt>
      <dd className="mt-0.5 font-medium text-tinta">{valor}</dd>
    </div>
  )
}

export default async function PaginaVeiculo({ params }: PageProps<'/veiculos/[slug]'>) {
  const { slug } = await params
  const v = await buscarVeiculoPorSlug(slug)
  if (!v) notFound()

  const [config, vendedores, relacionados] = await Promise.all([
    buscarConfig(),
    buscarVendedores(),
    buscarRelacionados(v.id, 4),
  ])

  const titulo = tituloVeiculo(v)
  const preco = reais(v.preco_centavos)
  const mensagem = mensagemVeiculo(titulo, preco)

  // Vendedor responsavel pelo carro. Sem responsavel, a escolha fica com a
  // pessoa, que e melhor do que mandar todo mundo pro mesmo numero.
  const responsavel = vendedores.find((x) => x.id === v.vendedor_id)
  // Com responsavel, o contato vai direto pra ele. Sem responsavel, entra no
  // rodizio pela rota /atendimento, que decide na hora do clique.
  const msgSimulacao = `Olá! Simulei o financiamento do *${titulo}* (${preco}) no site e quero falar com um vendedor.`
  const linkSimulacao = responsavel
    ? linkWhatsApp(responsavel.whatsapp, msgSimulacao)
    : vendedores.length > 0
      ? `/atendimento?msg=${encodeURIComponent(msgSimulacao)}`
      : undefined

  const ficha = Object.entries(v.ficha ?? {})

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8 lg:py-12">
        <nav aria-label="Você está aqui" className="text-xs text-tinta-fraca">
          <Link href="/" className="hover:text-ultra">
            Início
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <Link href="/veiculos" className="hover:text-ultra">
            Estoque
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-tinta">{titulo}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-10">
          <div className="min-w-0">
            <GaleriaVeiculo fotos={v.veiculo_fotos ?? []} titulo={titulo} />
          </div>

          <div className="min-w-0">
            <div className="rounded-2xl border border-linha bg-carta p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-ultra">
                {v.marca}
                {v.ano_modelo && ` · ${v.ano_modelo}`}
              </p>
              <h1 className="mt-2 font-display text-2xl uppercase leading-tight text-tinta lg:text-3xl">
                {titulo}
              </h1>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
                Valor
              </p>
              <p className="numeros-tabela font-display text-4xl text-tinta">{preco}</p>

              <dl className="mt-6 grid grid-cols-2 gap-3">
                <Spec rotulo="Ano" valor={ano(v.ano_fabricacao, v.ano_modelo) || null} />
                <Spec rotulo="Quilometragem" valor={v.km !== null ? km(v.km) : null} />
                <Spec rotulo="Câmbio" valor={v.cambio} />
                <Spec rotulo="Combustível" valor={v.combustivel} />
                <Spec rotulo="Cor" valor={v.cor} />
                <Spec rotulo="Carroceria" valor={v.carroceria} />
              </dl>

              <div className="mt-6">
                <BotaoWhats
                  vendedor={responsavel}
                  vendedores={vendedores}
                  mensagem={mensagem}
                  rotulo={responsavel ? `Falar com ${responsavel.nome}` : 'Falar com um vendedor'}
                  className="btn-toque py-4"
                  classeWrapper="w-full"
                />
              </div>

              <ul className="mt-5 space-y-2 border-t border-linha pt-5 text-sm text-tinta-fraca">
                {['Procedência verificada', 'Documentação completa', 'Revisado antes da entrega'].map(
                  (s) => (
                    <li key={s} className="flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden
                        className="size-4 text-zap"
                      >
                        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {s}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="mt-6">
              <SimuladorParcela
                precoCentavos={v.preco_centavos}
                cfg={config.financiamento}
                linkWhats={linkSimulacao}
              />
            </div>
          </div>
        </div>

        {ficha.length > 0 && (
          <section aria-labelledby="ficha" className="mt-12">
            <h2 id="ficha" className="font-display text-2xl uppercase text-tinta">
              Ficha técnica
            </h2>
            <dl className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-linha bg-linha sm:grid-cols-2">
              {ficha.map(([chave, valor]) => (
                <div key={chave} className="flex justify-between gap-4 bg-carta px-4 py-3">
                  <dt className="text-sm text-tinta-fraca">{chave}</dt>
                  <dd className="text-sm font-medium text-tinta">{String(valor)}</dd>
                </div>
              ))}
                          </dl>
          </section>
        )}

        {v.opcionais.length > 0 && (
          <section aria-labelledby="opcionais" className="mt-12">
            <h2 id="opcionais" className="font-display text-2xl uppercase text-tinta">
              Equipamentos e opcionais
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {v.opcionais.map((o) => (
                <li
                  key={o}
                  className="flex items-center gap-2 rounded-full border border-linha bg-carta px-3.5 py-2 text-sm text-tinta"
                >
                  <span aria-hidden className="size-1.5 rounded-full bg-ouro" />
                  {o}
                </li>
              ))}
            </ul>
          </section>
        )}

        {v.descricao && (
          <section aria-labelledby="descricao" className="mt-12">
            <h2 id="descricao" className="font-display text-2xl uppercase text-tinta">
              Descrição
            </h2>
            {/* Texto puro de propósito: o que o painel grava nunca vira HTML. */}
            <p className="mt-4 max-w-prose whitespace-pre-line leading-relaxed text-tinta">
              {v.descricao}
            </p>
          </section>
        )}
      </div>

      {relacionados.length > 0 && (
        <section aria-labelledby="outros" className="bg-escuro py-14">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="outros" className="font-display text-2xl uppercase text-gelo lg:text-3xl">
                Outros carros disponíveis
              </h2>
              <Link
                href="/veiculos"
                className="btn-toque rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-gelo hover:border-ultra hover:text-ultra-claro"
              >
                Ver todos
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {relacionados.map((r) => (
                <CardVeiculo key={r.id} veiculo={r} financiamento={config.financiamento} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
