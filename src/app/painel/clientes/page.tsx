import Image from 'next/image'
import Link from 'next/link'
import { lerFotosDeClientes } from '@/lib/fotos-clientes'
import {
  alternarEspelhoCliente,
  moverFotoCliente,
  removerFotoCliente,
} from '@/app/painel/acoes'
import { EnviarFotosClientes } from '@/components/painel/EnviarFotosClientes'
import { BotaoConfirmar } from '@/components/painel/BotaoConfirmar'

/**
 * Fotos do carrossel "Quem ja e da Ultra", gerenciadas pelo Pietro.
 *
 * Subir, virar de lado, mudar de lugar e remover. Qual foto esta "torta" e
 * decisao do olho de quem olha, nao regra de codigo, por isso fica aqui.
 * Virar de lado nao edita o arquivo: clicar de novo devolve a original.
 */
export default async function PainelClientes({ searchParams }: PageProps<'/painel/clientes'>) {
  const sp = await searchParams
  const deuErro = sp.erro === '1'

  const fotos = await lerFotosDeClientes()

  const botaoIcone =
    'flex flex-1 items-center justify-center py-2.5 text-tinta transition hover:bg-fundo disabled:opacity-30'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase text-tinta">Fotos de clientes</h1>
        <p className="mt-1 max-w-2xl text-tinta-fraca">
          O carrossel &ldquo;Quem já é da Ultra&rdquo;, na página inicial. {fotos.length}{' '}
          {fotos.length === 1 ? 'foto' : 'fotos'}, na ordem em que aparecem.{' '}
          <Link href="/#clientes" target="_blank" className="text-ultra hover:underline">
            Ver como está no site
          </Link>
        </p>
      </div>

      {deuErro && (
        <p
          role="alert"
          className="rounded-lg border border-ultra/40 bg-ultra/10 px-4 py-3 text-sm text-tinta"
        >
          Não consegui salvar. Tente de novo em alguns segundos.
        </p>
      )}

      <EnviarFotosClientes />

      {fotos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-linha bg-carta p-10 text-center text-tinta-fraca">
          Nenhuma foto ainda. Enquanto estiver vazio, a seção não aparece no site.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {fotos.map((f, i) => (
            <li key={f.id}>
              <figure className="overflow-hidden rounded-2xl border border-linha bg-carta">
                <div className="relative aspect-3/4 bg-escuro-2">
                  {/* Mesma inversao por CSS do site: o que aparece aqui e o que sai la. */}
                  <Image
                    src={f.src}
                    alt={`Foto ${i + 1} do carrossel de clientes`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className={`object-cover ${f.espelhada ? '-scale-x-100' : ''}`}
                  />
                  <span className="absolute left-2 top-2 rounded bg-escuro/80 px-2 py-0.5 text-xs font-bold text-gelo">
                    {i + 1}
                  </span>
                </div>

                <figcaption className="space-y-2 p-2.5">
                  <form action={alternarEspelhoCliente}>
                    <input type="hidden" name="id" value={f.id} />
                    <button
                      type="submit"
                      className={`btn-toque flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                        f.espelhada
                          ? 'border-ultra bg-ultra/10 text-ultra hover:bg-ultra/20'
                          : 'border-tinta/15 text-tinta hover:border-ultra hover:text-ultra'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className="size-4">
                        <path d="M12 3v18" strokeLinecap="round" strokeDasharray="3 3" />
                        <path d="M9 7 4 12l5 5V7Z" strokeLinejoin="round" />
                        <path d="m15 7 5 5-5 5V7Z" strokeLinejoin="round" />
                      </svg>
                      {f.espelhada ? 'Desfazer' : 'Virar de lado'}
                    </button>
                  </form>

                  <div className="flex divide-x divide-linha overflow-hidden rounded-full border border-linha">
                    <form action={moverFotoCliente} className="flex flex-1">
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="direcao" value="antes" />
                      <button
                        type="submit"
                        disabled={i === 0}
                        aria-label={`Mover a foto ${i + 1} para antes`}
                        className={botaoIcone}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="size-4 rotate-180">
                          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </form>
                    <form action={moverFotoCliente} className="flex flex-1">
                      <input type="hidden" name="id" value={f.id} />
                      <input type="hidden" name="direcao" value="depois" />
                      <button
                        type="submit"
                        disabled={i === fotos.length - 1}
                        aria-label={`Mover a foto ${i + 1} para depois`}
                        className={botaoIcone}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="size-4">
                          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </form>
                    <form action={removerFotoCliente} className="flex flex-1">
                      <input type="hidden" name="id" value={f.id} />
                      <BotaoConfirmar
                        pergunta={`Remover a foto ${i + 1} do site? Não dá pra desfazer.`}
                        aria-label={`Remover a foto ${i + 1}`}
                        className="flex flex-1 items-center justify-center py-2.5 text-ultra transition hover:bg-ultra/5"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="size-4">
                          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </BotaoConfirmar>
                    </form>
                  </div>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
