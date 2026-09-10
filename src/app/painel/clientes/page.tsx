import Image from 'next/image'
import Link from 'next/link'
import { lerFotosDeClientes } from '@/lib/fotos-clientes'
import { alternarEspelhoCliente } from '@/app/painel/acoes'

/**
 * Tela do espelho das fotos de cliente.
 *
 * O que ela resolve: as fotos do carrossel da home foram tiradas de lados
 * diferentes, entao alguns carros apontam pra esquerda e outros pra direita.
 * Quem decide qual esta torta e o olho de quem olha, nao uma regra que da pra
 * escrever no codigo, entao a decisao fica aqui, com quem tem o olho.
 *
 * O botao nao edita a foto: ele so marca que aquele arquivo aparece invertido
 * no site. Clicar de novo desfaz, com a foto igual a original.
 *
 * Subir foto nova continua sendo commit na pasta `public/img/clientes`. Se um
 * dia isso tambem precisar vir pro painel, a tela ja esta aqui pra crescer.
 */
export default async function PainelClientes({ searchParams }: PageProps<'/painel/clientes'>) {
  const sp = await searchParams
  const deuErro = sp.erro === '1'

  const fotos = await lerFotosDeClientes()
  const espelhadas = fotos.filter((f) => f.espelhada).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase text-tinta">Fotos de clientes</h1>
        <p className="mt-1 max-w-2xl text-tinta-fraca">
          As fotos do carrossel &ldquo;Quem já é da Ultra&rdquo;, na página inicial. Use o
          botão para virar a foto de lado e deixar todos os carros apontando na mesma
          direção.{' '}
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

      <div className="rounded-lg border border-linha bg-carta px-4 py-3 text-sm text-tinta-fraca">
        {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'} no carrossel
        {espelhadas > 0 && (
          <>
            {', '}
            {espelhadas} {espelhadas === 1 ? 'virada' : 'viradas'} de lado
          </>
        )}
        . A mudança aparece no site em alguns segundos.
      </div>

      {fotos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-linha bg-carta p-10 text-center text-tinta-fraca">
          Nenhuma foto de cliente ainda. Elas ficam na pasta do site: peça ao Felipe para
          subir as novas.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {fotos.map((f) => (
            <li key={f.arquivo}>
              <figure className="overflow-hidden rounded-2xl border border-linha bg-carta">
                <div className="relative aspect-3/4 bg-escuro-2">
                  {/*
                    Mesma inversao por CSS que o site usa, pra o que o Pietro ve
                    aqui ser exatamente o que sai no carrossel.
                  */}
                  <Image
                    src={f.src}
                    alt={f.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className={`object-cover ${f.espelhada ? '-scale-x-100' : ''}`}
                  />
                </div>

                <figcaption className="space-y-3 p-3">
                  <p className="truncate text-xs text-tinta-fraca">
                    {f.nome ?? f.arquivo}
                    {f.espelhada && (
                      <span className="ml-1.5 font-medium text-ultra">· virada</span>
                    )}
                  </p>

                  <form action={alternarEspelhoCliente}>
                    <input type="hidden" name="arquivo" value={f.arquivo} />
                    <button
                      type="submit"
                      className={`btn-toque flex w-full items-center justify-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                        f.espelhada
                          ? 'border-ultra bg-ultra/10 text-ultra hover:bg-ultra/20'
                          : 'border-tinta/15 text-tinta hover:border-ultra hover:text-ultra'
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden
                        className="size-4"
                      >
                        <path d="M12 3v18" strokeLinecap="round" strokeDasharray="3 3" />
                        <path d="M9 7 4 12l5 5V7Z" strokeLinejoin="round" />
                        <path d="m15 7 5 5-5 5V7Z" strokeLinejoin="round" />
                      </svg>
                      {f.espelhada ? 'Desfazer' : 'Virar de lado'}
                    </button>
                  </form>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
