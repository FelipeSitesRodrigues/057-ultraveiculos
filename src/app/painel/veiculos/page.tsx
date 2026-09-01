import Image from 'next/image'
import Link from 'next/link'
import { contarDestaques, listarVeiculos, MAX_DESTAQUES, type FiltroPainel } from '@/lib/painel'
import { urlDaFoto } from '@/lib/dados'
import { reais, tituloVeiculo } from '@/lib/formato'
import { descontoMaximo, diasNoEstoque, lucroPrevisto } from '@/types/database'
import { STATUS_ROTULO } from '@/lib/opcionais'
import { alternarDestaque } from '@/app/painel/acoes'

/** Recados do topo, todos vindos de um redirect da ação de destaque. */
const AVISO_DESTAQUE: Record<string, string> = {
  cheio: `Você já tem ${MAX_DESTAQUES} carros em destaque, que é o limite da home. Tire um antes de colocar outro.`,
  'fora-do-ar': 'Só carro publicado pode ir pra home. Coloque o carro no site primeiro.',
  erro: 'Não deu pra mudar o destaque agora. Tente de novo.',
}

const FILTROS: { chave: FiltroPainel; rotulo: string }[] = [
  { chave: 'todos', rotulo: 'Todos' },
  { chave: 'publicado', rotulo: 'No site' },
  { chave: 'rascunho', rotulo: 'Fora do site' },
  { chave: 'girar', rotulo: 'Girar (+90d)' },
  { chave: 'vendido', rotulo: 'Vendidos' },
  { chave: 'arquivado', rotulo: 'Arquivados' },
]

const COR_STATUS: Record<string, string> = {
  publicado: 'bg-zap/15 text-zap-escuro',
  rascunho: 'bg-tinta/10 text-tinta-fraca',
  preparacao: 'bg-ouro/20 text-ouro-sombra',
  vendido: 'bg-ultra/10 text-ultra',
  arquivado: 'bg-tinta/10 text-tinta-fraca',
}

export default async function EstoquePainel({ searchParams }: PageProps<'/painel/veiculos'>) {
  const sp = await searchParams
  const filtro = (typeof sp.filtro === 'string' ? sp.filtro : 'todos') as FiltroPainel
  const busca = typeof sp.busca === 'string' ? sp.busca : ''
  const arquivado = sp.arquivado === '1'
  const avisoDestaque = typeof sp.destaque === 'string' ? AVISO_DESTAQUE[sp.destaque] : undefined

  const [veiculos, emDestaque] = await Promise.all([
    listarVeiculos(filtro, busca),
    contarDestaques(),
  ])
  const lotado = emDestaque >= MAX_DESTAQUES

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase text-tinta">Estoque</h1>
          <p className="mt-1 text-tinta-fraca">
            {veiculos.length} {veiculos.length === 1 ? 'carro' : 'carros'} nesta lista
            <span className="mx-2 text-linha">·</span>
            <span className={lotado ? 'font-semibold text-ultra' : ''}>
              <span className="numeros-tabela">
                {emDestaque} de {MAX_DESTAQUES}
              </span>{' '}
              em destaque na home
            </span>
          </p>
        </div>
        <Link
          href="/painel/veiculos/novo"
          className="btn-toque inline-flex items-center gap-2 rounded-full bg-ultra px-6 py-3 font-semibold text-white hover:bg-ultra-claro"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Adicionar carro
        </Link>
      </div>

      {arquivado && (
        <p className="rounded-lg border border-linha bg-carta px-4 py-3 text-sm text-tinta">
          Carro arquivado. Ele saiu do site, mas continua guardado aqui.
        </p>
      )}

      {avisoDestaque && (
        <p
          role="alert"
          className="rounded-lg border border-ultra/40 bg-ultra/5 px-4 py-3 text-sm text-tinta"
        >
          {avisoDestaque}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form className="relative flex-1" action="/painel/veiculos">
          <input type="hidden" name="filtro" value={filtro} />
          <input
            type="search"
            name="busca"
            defaultValue={busca}
            placeholder="Buscar modelo, ano, cor..."
            aria-label="Buscar no estoque"
            className="w-full rounded-full border border-linha bg-carta px-5 py-3 text-sm text-tinta"
          />
        </form>
      </div>

      <div className="trilha -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTROS.map((f) => {
          const ativo = filtro === f.chave
          const q = new URLSearchParams()
          if (f.chave !== 'todos') q.set('filtro', f.chave)
          if (busca) q.set('busca', busca)
          const s = q.toString()
          return (
            <Link
              key={f.chave}
              href={s ? `/painel/veiculos?${s}` : '/painel/veiculos'}
              aria-current={ativo ? 'page' : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                ativo
                  ? 'bg-tinta text-white'
                  : 'border border-linha bg-carta text-tinta hover:border-ultra'
              }`}
            >
              {f.rotulo}
            </Link>
          )
        })}
      </div>

      {veiculos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-linha bg-carta p-12 text-center">
          <p className="font-display text-xl uppercase text-tinta">
            {busca ? 'Nada encontrado' : 'Nenhum carro aqui ainda'}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-tinta-fraca">
            {busca
              ? 'Tente outro termo, ou limpe a busca.'
              : 'Cadastre o primeiro carro e ele aparece no site assim que você marcar como publicado.'}
          </p>
          <Link
            href="/painel/veiculos/novo"
            className="btn-toque mt-6 inline-flex rounded-full bg-ultra px-6 py-3 text-sm font-semibold text-white hover:bg-ultra-claro"
          >
            Adicionar carro
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {veiculos.map((v) => {
            const fotos = [...(v.veiculo_fotos ?? [])].sort((a, b) => a.ordem - b.ordem)
            const capa = fotos[0] ? urlDaFoto(fotos[0].path) : null
            const fin = v.veiculo_financeiro
            const desc = descontoMaximo(v.preco_centavos, fin?.minimo_centavos ?? null)
            const lucro = lucroPrevisto(v.preco_centavos, fin?.custo_centavos ?? null)

            return (
              <li key={v.id}>
                {/* O cartao inteiro leva pra edicao, mas o botao com o lapis
                    fica visivel: sem ele, nada na tela diz que da pra editar.
                    O link do titulo cobre o cartao com ::after, entao o botao
                    e o mesmo destino, e nao um link dentro de outro. */}
                <article className="card-sobe group relative overflow-hidden rounded-2xl border border-linha bg-carta">
                  <div className="relative aspect-4/3 bg-fundo">
                    {capa ? (
                      <Image
                        src={capa}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-sm text-tinta-fraca">
                        sem foto
                      </span>
                    )}
                    <span className="numeros-tabela absolute left-3 top-3 rounded-md bg-escuro/85 px-2 py-1 text-xs font-semibold text-gelo">
                      {diasNoEstoque(v.entrou_em)}d
                    </span>
                    <span
                      className={`absolute right-3 top-3 rounded-md px-2 py-1 text-[11px] font-semibold ${
                        COR_STATUS[v.status] ?? 'bg-tinta/10 text-tinta'
                      }`}
                    >
                      {STATUS_ROTULO[v.status]?.rotulo ?? v.status}
                    </span>
                  </div>

                  <div className="p-4">
                    <h2 className="font-display text-sm uppercase leading-tight text-tinta">
                      <Link
                        href={`/painel/veiculos/${v.id}`}
                        className="after:absolute after:inset-0"
                      >
                        {tituloVeiculo(v)}
                      </Link>
                    </h2>
                    <p className="numeros-tabela mt-1 text-xs text-tinta-fraca">
                      {v.ano_modelo} · {v.km?.toLocaleString('pt-BR')} km
                    </p>

                    <dl className="mt-3 space-y-1 border-t border-linha pt-3 text-sm">
                      <div className="flex items-baseline justify-between">
                        <dt className="text-xs uppercase tracking-wide text-tinta-fraca">
                          Tabela
                        </dt>
                        <dd className="numeros-tabela font-display text-lg text-tinta">
                          {reais(v.preco_centavos)}
                        </dd>
                      </div>
                    </dl>

                    {fin?.minimo_centavos != null ? (
                      <div className="mt-3 rounded-xl bg-zap/5 p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-tinta-fraca">
                            Mínimo
                          </span>
                          {desc !== null && (
                            <span className="numeros-tabela text-xs text-ultra">
                              -{reais(desc)}
                            </span>
                          )}
                        </div>
                        <p className="numeros-tabela font-display text-xl text-tinta">
                          {reais(fin.minimo_centavos)}
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 rounded-xl bg-ultra/5 px-3 py-2 text-xs text-ultra">
                        Falta definir a margem
                      </p>
                    )}

                    <div className="numeros-tabela mt-3 flex items-center justify-between border-t border-linha pt-3 text-xs text-tinta-fraca">
                      <span>
                        Custo {fin?.custo_centavos != null ? reais(fin.custo_centavos) : '—'}
                      </span>
                      <span>Lucro {lucro !== null ? reais(lucro) : '—'}</span>
                    </div>

                    {/* A caixinha do destaque. Esta SIM precisa de z-index: ela
                        é o único ponto do cartão que faz algo diferente de
                        abrir a edição, então tem que ficar ACIMA da camada do
                        link do título, que cobre o cartão inteiro. */}
                    <form action={alternarDestaque} className="relative z-10 mt-4">
                      <input type="hidden" name="id" value={v.id} />
                      <button
                        type="submit"
                        disabled={!v.destaque && (lotado || v.status !== 'publicado')}
                        aria-pressed={v.destaque}
                        title={
                          v.destaque
                            ? 'Tirar da primeira parte da home'
                            : v.status !== 'publicado'
                              ? 'Só carro publicado pode ir pra home'
                              : lotado
                                ? `Limite de ${MAX_DESTAQUES} destaques atingido`
                                : 'Mostrar na primeira parte da home'
                        }
                        className={`btn-toque flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                          v.destaque
                            ? 'border-ultra bg-ultra/10 text-ultra'
                            : 'border-linha bg-carta text-tinta-fraca hover:border-ultra hover:text-tinta'
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`flex size-5 shrink-0 items-center justify-center rounded border-2 ${
                            v.destaque ? 'border-ultra bg-ultra text-white' : 'border-linha'
                          }`}
                        >
                          {v.destaque && (
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              className="size-3"
                            >
                              <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        Destaque na home
                      </button>
                    </form>

                    {/* Só marca visual: quem recebe o clique é a camada do
                        link do título, que cobre o cartão inteiro. Se este
                        bloco ficasse por cima (z-index), o clique morreria
                        justamente no botão que parece mais clicável. */}
                    <span className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-linha px-4 py-2.5 text-sm font-semibold text-tinta transition group-hover:border-ultra group-hover:bg-ultra group-hover:text-white">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden
                        className="size-4"
                      >
                        <path
                          d="M4 20h4L19 9a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5V20Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="m14.5 6.5 3 3" strokeLinecap="round" />
                      </svg>
                      Editar carro
                    </span>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
