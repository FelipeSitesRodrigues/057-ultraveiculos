'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

/**
 * Linha de busca, contagem e ordenacao, no topo da lista de carros.
 *
 * Fica junto do grid, e nao junto dos filtros, porque busca e ordenacao agem
 * sobre o que esta sendo mostrado. Filtro reduz o conjunto; isto aqui organiza
 * o resultado.
 */
export function BarraEstoque({ total }: { total: number }) {
  const router = useRouter()
  const caminho = usePathname()
  const params = useSearchParams()
  const [, iniciar] = useTransition()
  const [busca, setBusca] = useState(params.get('busca') ?? '')

  useEffect(() => setBusca(params.get('busca') ?? ''), [params])

  const aplicar = (chave: string, valor: string) => {
    const novo = new URLSearchParams(params.toString())
    if (valor) novo.set(chave, valor)
    else novo.delete(chave)
    novo.delete('pagina')
    iniciar(() => router.push(`${caminho}?${novo.toString()}`, { scroll: false }))
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault()
          aplicar('busca', busca)
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-tinta-fraca"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar marca ou modelo"
          aria-label="Buscar marca ou modelo"
          className="w-full rounded-full border border-linha bg-carta py-3 pl-12 pr-4 text-sm text-tinta placeholder:text-tinta-fraca"
        />
      </form>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <p className="numeros-tabela shrink-0 text-sm text-tinta-fraca">
          <strong className="text-tinta">{total}</strong>{' '}
          {total === 1 ? 'veículo' : 'veículos'}
        </p>

        <label className="flex items-center gap-2 text-sm text-tinta-fraca">
          <span className="sr-only sm:not-sr-only">Ordenar</span>
          <select
            value={params.get('ordem') ?? ''}
            onChange={(e) => aplicar('ordem', e.target.value)}
            className="rounded-full border border-linha bg-carta px-4 py-2.5 text-sm text-tinta"
          >
            <option value="">Mais recentes</option>
            <option value="preco-asc">Menor preço</option>
            <option value="preco-desc">Maior preço</option>
            <option value="km-asc">Menor km</option>
            <option value="ano-desc">Mais novo</option>
          </select>
        </label>
      </div>
    </div>
  )
}
