'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { SliderFaixa } from '@/components/SliderFaixa'
import type { OpcoesFiltro } from '@/lib/dados'

/**
 * Coluna de filtros do estoque.
 *
 * Cada controle foi escolhido pelo tipo de decisao que ele representa:
 *   marca        varias de uma vez, entao caixa de marcar, com busca porque
 *                a lista cresce junto com o estoque
 *   preco e km   faixa continua, entao alca pra arrastar
 *   ano          valor exato que a pessoa tem na cabeca, entao "de" e "ate"
 *   cambio       duas opcoes, entao lista fixa (nao some quando o estoque
 *                fica so de manual por uma semana)
 */

const CAMBIOS_FIXOS = ['Manual', 'Automático'] as const

function Grupo({
  titulo,
  aberto = false,
  children,
}: {
  titulo: string
  aberto?: boolean
  children: React.ReactNode
}) {
  return (
    <details open={aberto} className="group border-b border-linha last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-sm font-semibold text-tinta marker:hidden">
        {titulo}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
          className="size-4 text-tinta-fraca transition group-open:rotate-180"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="pb-4">{children}</div>
    </details>
  )
}

const brl = (centavos: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(centavos / 100)

export function PainelFiltros({
  opcoes,
  total,
}: {
  opcoes: OpcoesFiltro
  total: number
}) {
  const router = useRouter()
  const caminho = usePathname()
  const params = useSearchParams()
  const [pendente, iniciar] = useTransition()
  const [abertoNoMobile, setAbertoNoMobile] = useState(false)
  const [buscaMarca, setBuscaMarca] = useState('')

  const aplicar = (mudancas: Record<string, string | null>) => {
    const novo = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(mudancas)) {
      if (v === null || v === '') novo.delete(k)
      else novo.set(k, v)
    }
    novo.delete('pagina')
    iniciar(() => router.push(`${caminho}?${novo.toString()}`, { scroll: false }))
  }

  const limpar = () => iniciar(() => router.push(caminho, { scroll: false }))

  // ---- marca: várias de uma vez ----
  const marcasEscolhidas = useMemo(
    () => (params.get('marcas') ?? '').split(',').filter(Boolean),
    [params],
  )

  const alternarMarca = (nome: string) => {
    const atual = new Set(marcasEscolhidas)
    if (atual.has(nome)) atual.delete(nome)
    else atual.add(nome)
    aplicar({ marcas: [...atual].join(',') || null })
  }

  const marcasVisiveis = opcoes.marcas.filter((m) =>
    m.nome.toLowerCase().includes(buscaMarca.trim().toLowerCase()),
  )

  // ---- preço, ano e km ----
  const passoPreco = 100_000 // R$ 1.000 em centavos
  const precoMin = Number(params.get('precoMin') ?? opcoes.precoMin)
  const precoMax = Number(params.get('precoMax') ?? opcoes.precoMax)

  const tetoKm = Math.max(10_000, Math.ceil(opcoes.kmMax / 10_000) * 10_000)
  const kmMax = Number(params.get('kmMax') ?? tetoKm)

  const anoAtual = new Date().getFullYear()
  const anos = Array.from({ length: anoAtual + 1 - 2000 + 1 }, (_, i) => anoAtual + 1 - i)

  const ativos = [...params.keys()].filter((k) => k !== 'ordem' && k !== 'pagina').length

  const conteudo = (
    <div className={pendente ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      <div className="flex items-baseline justify-between border-b border-linha pb-3">
        <h2 className="font-display text-lg uppercase text-tinta">Filtros</h2>
        {ativos > 0 && (
          <button
            type="button"
            onClick={limpar}
            className="text-xs font-semibold text-ultra hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      <Grupo titulo="Marca" aberto>
        {opcoes.marcas.length > 6 && (
          <input
            type="search"
            value={buscaMarca}
            onChange={(e) => setBuscaMarca(e.target.value)}
            placeholder="Buscar marca"
            aria-label="Buscar marca"
            className="mb-3 w-full rounded-lg border border-linha bg-fundo px-3 py-2 text-sm text-tinta placeholder:text-tinta-fraca"
          />
        )}

        <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
          {marcasVisiveis.map((m) => {
            const marcada = marcasEscolhidas.includes(m.nome)
            return (
              <li key={m.nome}>
                <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={marcada}
                    onChange={() => alternarMarca(m.nome)}
                    className="size-4 shrink-0 rounded accent-ultra"
                  />
                  <span className={marcada ? 'font-semibold text-tinta' : 'text-tinta-fraca'}>
                    {m.nome}
                  </span>
                  <span className="numeros-tabela ml-auto text-xs text-tinta-fraca">
                    {m.total}
                  </span>
                </label>
              </li>
            )
          })}

          {marcasVisiveis.length === 0 && (
            <li className="py-2 text-sm text-tinta-fraca">
              Nenhuma marca com esse nome no estoque.
            </li>
          )}
        </ul>
      </Grupo>

      <Grupo titulo="Preço">
        <SliderFaixa
          min={opcoes.precoMin}
          max={opcoes.precoMax}
          passo={passoPreco}
          valorMin={precoMin}
          valorMax={precoMax}
          formatar={brl}
          aoSoltar={(a, b) =>
            aplicar({
              precoMin: a <= opcoes.precoMin ? null : String(a),
              precoMax: b >= opcoes.precoMax ? null : String(b),
            })
          }
        />
      </Grupo>

      <Grupo titulo="Ano">
        {/* Dois campos lado a lado numa coluna de 16rem: sem a palavra "até"
            no meio, cada select fica com largura pra mostrar o ano inteiro. */}
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="text-xs text-tinta-fraca">De</span>
            <select
              value={params.get('anoMin') ?? ''}
              onChange={(e) => aplicar({ anoMin: e.target.value })}
              className="numeros-tabela mt-1 w-full rounded-lg border border-linha bg-carta px-2 py-2 text-sm text-tinta"
            >
              <option value="">Todos</option>
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-xs text-tinta-fraca">Até</span>
            <select
              value={params.get('anoMax') ?? ''}
              onChange={(e) => aplicar({ anoMax: e.target.value })}
              className="numeros-tabela mt-1 w-full rounded-lg border border-linha bg-carta px-2 py-2 text-sm text-tinta"
            >
              <option value="">Todos</option>
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Grupo>

      <Grupo titulo="Quilometragem">
        <SliderFaixa
          min={0}
          max={tetoKm}
          passo={5_000}
          valorMin={0}
          valorMax={kmMax}
          formatar={(v) => `${v.toLocaleString('pt-BR')} km`}
          rotuloSemLimite="Sem limite"
          aoSoltar={(_, b) => aplicar({ kmMax: b >= tetoKm ? null : String(b) })}
        />
      </Grupo>

      <Grupo titulo="Câmbio">
        <ul className="space-y-0.5">
          {CAMBIOS_FIXOS.map((c) => {
            const marcado = params.get('cambio') === c
            return (
              <li key={c}>
                <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => aplicar({ cambio: marcado ? null : c })}
                    className="size-4 shrink-0 rounded accent-ultra"
                  />
                  <span className={marcado ? 'font-semibold text-tinta' : 'text-tinta-fraca'}>
                    {c}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </Grupo>

      {opcoes.combustiveis.length > 0 && (
        <Grupo titulo="Combustível">
          <ul className="space-y-0.5">
            {opcoes.combustiveis.map((c) => {
              const marcado = params.get('combustivel') === c
              return (
                <li key={c}>
                  <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => aplicar({ combustivel: marcado ? null : c })}
                      className="size-4 shrink-0 rounded accent-ultra"
                    />
                    <span
                      className={marcado ? 'font-semibold text-tinta' : 'text-tinta-fraca'}
                    >
                      {c}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </Grupo>
      )}

      <button
        type="button"
        onClick={() => setAbertoNoMobile(false)}
        className="btn-toque mt-5 w-full rounded-full bg-ultra px-5 py-3 text-sm font-semibold text-white hover:bg-ultra-claro"
      >
        Ver {total} {total === 1 ? 'veículo' : 'veículos'}
      </button>
    </div>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setAbertoNoMobile(true)}
        className="btn-toque flex w-full items-center justify-center gap-2 rounded-full border border-linha bg-carta px-5 py-3 text-sm font-semibold text-tinta lg:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="size-4">
          <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
        </svg>
        Filtros
        {ativos > 0 && (
          <span className="rounded-full bg-ultra px-2 py-0.5 text-xs text-white">{ativos}</span>
        )}
      </button>

      {abertoNoMobile && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Fechar filtros"
            className="flex-1 bg-breu/70"
            onClick={() => setAbertoNoMobile(false)}
          />
          <div className="ml-auto h-full w-[85%] max-w-sm overflow-y-auto bg-carta p-5">
            {conteudo}
          </div>
        </div>
      )}

      <aside aria-label="Filtros" className="hidden lg:block">
        <div className="sticky top-24 rounded-2xl border border-linha bg-carta p-5">
          {conteudo}
        </div>
      </aside>
    </>
  )
}
