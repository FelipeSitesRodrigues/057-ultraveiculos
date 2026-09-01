import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FormVeiculo } from '@/components/painel/FormVeiculo'
import { buscarVeiculoPorId, listarVendedoresPainel } from '@/lib/painel'
import { urlDaFoto } from '@/lib/dados'
import { tituloVeiculo } from '@/lib/formato'
import { apagarFoto, arquivarVeiculo, definirCapa, mudarStatus } from '@/app/painel/acoes'
import { STATUS_ROTULO } from '@/lib/opcionais'

export default async function EditarVeiculo({ params, searchParams }: PageProps<'/painel/veiculos/[id]'>) {
  const { id } = await params
  const sp = await searchParams
  const salvo = sp.salvo === '1'

  const [veiculo, vendedores] = await Promise.all([
    buscarVeiculoPorId(id),
    listarVendedoresPainel(),
  ])

  if (!veiculo) notFound()

  const fotos = [...(veiculo.veiculo_fotos ?? [])].sort((a, b) => a.ordem - b.ordem)
  const titulo = tituloVeiculo(veiculo)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/painel/veiculos" className="text-sm text-tinta-fraca hover:text-ultra">
          ← Voltar ao estoque
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl uppercase text-tinta">{titulo}</h1>
            <p className="mt-1 text-sm text-tinta-fraca">
              {STATUS_ROTULO[veiculo.status]?.rotulo} ·{' '}
              {STATUS_ROTULO[veiculo.status]?.ajuda}
            </p>
          </div>
          {veiculo.status === 'publicado' && (
            <Link
              href={`/veiculos/${veiculo.slug}`}
              target="_blank"
              className="btn-toque rounded-full border border-linha bg-carta px-5 py-2.5 text-sm font-medium text-tinta hover:border-ultra hover:text-ultra"
            >
              Ver no site
            </Link>
          )}
        </div>
      </div>

      {salvo && (
        <p
          role="status"
          className="rounded-lg border border-zap/40 bg-zap/10 px-4 py-3 text-sm text-tinta"
        >
          Carro salvo.
        </p>
      )}

      <FormVeiculo veiculo={veiculo} vendedores={vendedores} />

      <section className="rounded-2xl border border-linha bg-carta p-6">
        <h2 className="font-display text-lg uppercase text-tinta">
          Fotos deste carro ({fotos.length})
        </h2>
        {fotos.length === 0 ? (
          <p className="mt-2 text-sm text-tinta-fraca">
            Nenhuma foto ainda. Use o campo de fotos no formulário acima.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-tinta-fraca">
              A primeira é a capa, que aparece no card do site.
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {fotos.map((f, i) => (
                <li key={f.id} className="overflow-hidden rounded-xl border border-linha">
                  <div className="relative aspect-4/3 bg-fundo">
                    <Image
                      src={urlDaFoto(f.path)}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute left-2 top-2 rounded bg-ultra px-2 py-0.5 text-[11px] font-bold uppercase text-white">
                        Capa
                      </span>
                    )}
                  </div>
                  <div className="flex divide-x divide-linha border-t border-linha text-xs">
                    {i !== 0 && (
                      <form action={definirCapa} className="flex-1">
                        <input type="hidden" name="fotoId" value={f.id} />
                        <input type="hidden" name="veiculoId" value={veiculo.id} />
                        <button
                          type="submit"
                          className="w-full py-2.5 font-medium text-tinta transition hover:bg-fundo"
                        >
                          Usar de capa
                        </button>
                      </form>
                    )}
                    <form action={apagarFoto} className="flex-1">
                      <input type="hidden" name="fotoId" value={f.id} />
                      <input type="hidden" name="veiculoId" value={veiculo.id} />
                      <button
                        type="submit"
                        className="w-full py-2.5 font-medium text-ultra transition hover:bg-ultra/5"
                      >
                        Apagar
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-linha bg-carta p-6">
        <h2 className="font-display text-lg uppercase text-tinta">Situação do carro</h2>
        <p className="mt-1 max-w-prose text-sm text-tinta-fraca">
          Nada aqui apaga o carro. Fotos, preço e histórico continuam guardados, e dá
          pra voltar atrás quando quiser.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {veiculo.status === 'publicado' && (
            <form action={mudarStatus}>
              <input type="hidden" name="id" value={veiculo.id} />
              <input type="hidden" name="status" value="vendido" />
              <button
                type="submit"
                className="btn-toque rounded-full bg-zap px-6 py-2.5 text-sm font-semibold text-white hover:bg-zap-escuro"
              >
                Marcar como vendido
              </button>
            </form>
          )}

          {(veiculo.status === 'vendido' || veiculo.status === 'arquivado') && (
            <form action={mudarStatus}>
              <input type="hidden" name="id" value={veiculo.id} />
              <input type="hidden" name="status" value="publicado" />
              <button
                type="submit"
                className="btn-toque rounded-full bg-ultra px-6 py-2.5 text-sm font-semibold text-white hover:bg-ultra-claro"
              >
                Colocar de volta no site
              </button>
            </form>
          )}

          {veiculo.status !== 'arquivado' && (
            <form action={arquivarVeiculo}>
              <input type="hidden" name="id" value={veiculo.id} />
              <button
                type="submit"
                className="btn-toque rounded-full border border-linha px-6 py-2.5 text-sm font-semibold text-tinta hover:border-ultra hover:text-ultra"
              >
                Arquivar
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
