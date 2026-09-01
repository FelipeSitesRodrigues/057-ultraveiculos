'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { criarClienteNavegador } from '@/lib/supabase/navegador'
import { palavrasDaBusca } from '@/lib/dados'

type Achado = {
  id: string
  slug: string
  marca: string
  modelo: string
  versao: string
  ano_modelo: number | null
  km: number | null
  preco_centavos: number
  veiculo_fotos: { path: string; ordem: number }[]
}

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

/**
 * Busca do cabecalho.
 *
 * Abre ja mostrando o estoque inteiro, em vez de um campo vazio esperando a
 * pessoa adivinhar o que digitar: quem clica na lupa quer ver carro, e o
 * estoque de uma revenda cabe numa lista.
 *
 * Le direto do banco pelo navegador, com a mesma chave publica do site. A RLS
 * so devolve veiculo publicado, entao nao ha o que vazar aqui.
 */
export function BuscaRapida() {
  const [aberto, setAberto] = useState(false)
  const [termo, setTermo] = useState('')
  const [lista, setLista] = useState<Achado[]>([])
  const [carregando, setCarregando] = useState(false)
  const campoRef = useRef<HTMLInputElement>(null)
  const dialogoRef = useRef<HTMLDivElement>(null)

  const CAMPOS =
    'id, slug, marca, modelo, versao, ano_modelo, km, preco_centavos, veiculo_fotos(path, ordem)'

  const buscar = useCallback(async (t: string) => {
    setCarregando(true)
    const sb = criarClienteNavegador()

    // A busca roda contra `busca_simples`, coluna que o banco mantem sem
    // acento e em minuscula. E por isso que "citroen" acha "Citroën".
    const palavras = palavrasDaBusca(t)

    let q = sb
      .from('veiculos')
      .select(CAMPOS)
      .eq('status', 'publicado')
      .order('destaque', { ascending: false })
      .limit(24)

    for (const palavra of palavras) {
      q = q.ilike('busca_simples', `%${palavra}%`)
    }

    const { data } = await q
    let achados = (data ?? []) as unknown as Achado[]

    // Nada exato: pergunta o que se parece. Cobre "Renaut", "citroem".
    if (achados.length === 0 && palavras.length > 0) {
      const { data: ids } = await sb.rpc('veiculos_parecidos', { termo: t })
      const lista = ((ids ?? []) as { id: string }[]).map((r) => r.id)
      if (lista.length > 0) {
        const { data: parecidos } = await sb
          .from('veiculos')
          .select(CAMPOS)
          .eq('status', 'publicado')
          .in('id', lista)
        achados = ((parecidos ?? []) as unknown as Achado[]).sort(
          (a, b) => lista.indexOf(a.id) - lista.indexOf(b.id),
        )
      }
    }

    setLista(achados)
    setCarregando(false)
  }, [])

  // Abre já com o estoque carregado.
  useEffect(() => {
    if (aberto) {
      buscar('')
      campoRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setTermo('')
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [aberto, buscar])

  // Espera a pessoa parar de digitar pra não disparar uma busca por tecla.
  useEffect(() => {
    if (!aberto) return
    const id = setTimeout(() => buscar(termo), 280)
    return () => clearTimeout(id)
  }, [termo, aberto, buscar])

  // Esc fecha, como em qualquer busca que se preze.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false)
    }
    if (aberto) window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  const marcas = Array.from(new Set(lista.map((v) => v.marca))).slice(0, 6)

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Buscar veículos"
        className="btn-toque flex size-10 items-center justify-center rounded-full border border-white/15 text-gelo transition hover:border-ultra hover:text-ultra-claro"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="size-5">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-breu/80 p-4 pt-20 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (!dialogoRef.current?.contains(e.target as Node)) setAberto(false)
          }}
        >
          <div
            ref={dialogoRef}
            role="dialog"
            aria-modal="true"
            aria-label="Buscar veículos"
            className="revela flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-escuro-2 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="size-5 shrink-0 text-gelo-fraco">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                ref={campoRef}
                type="search"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar por marca, modelo ou ano..."
                aria-label="Buscar por marca, modelo ou ano"
                className="flex-1 bg-transparent py-1.5 text-gelo outline-none placeholder:text-gelo-fraco/70"
              />
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="rounded-md border border-white/15 px-2 py-1 text-[11px] font-semibold uppercase text-gelo-fraco transition hover:text-gelo"
              >
                Esc
              </button>
            </div>

            {marcas.length > 1 && (
              <div className="trilha flex gap-2 overflow-x-auto border-b border-white/10 px-4 py-3">
                {marcas.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTermo(m)}
                    className="shrink-0 rounded-full border border-white/15 px-3.5 py-1.5 text-sm text-gelo transition hover:border-ultra hover:text-ultra-claro"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-widest text-gelo-fraco">
              {carregando
                ? 'Buscando...'
                : lista.length === 0
                  ? 'Nenhum veículo encontrado'
                  : `${lista.length} ${lista.length === 1 ? 'veículo' : 'veículos'} no estoque`}
            </p>

            <ul className="flex-1 overflow-y-auto p-2">
              {lista.map((v) => {
                const foto = [...(v.veiculo_fotos ?? [])].sort((a, b) => a.ordem - b.ordem)[0]
                const titulo = [v.marca, v.modelo, v.versao].filter(Boolean).join(' ')
                return (
                  <li key={v.id}>
                    <Link
                      href={`/veiculos/${v.slug}`}
                      onClick={() => setAberto(false)}
                      className="flex items-center gap-4 rounded-xl p-2 transition hover:bg-white/5"
                    >
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-escuro">
                        {foto ? (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/veiculos/${foto.path}`}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-[10px] text-gelo-fraco">
                            sem foto
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gelo">{titulo}</p>
                        <p className="numeros-tabela text-sm text-gelo-fraco">
                          {v.ano_modelo}
                          {v.km !== null && ` · ${v.km.toLocaleString('pt-BR')} km`}
                        </p>
                      </div>

                      <p className="numeros-tabela shrink-0 font-display text-lg text-gelo">
                        {BRL.format(v.preco_centavos / 100)}
                      </p>
                    </Link>
                  </li>
                )
              })}
            </ul>

            {lista.length > 0 && (
              <div className="border-t border-white/10 p-3">
                <Link
                  href="/veiculos"
                  onClick={() => setAberto(false)}
                  className="block rounded-xl bg-ultra py-3 text-center text-sm font-semibold text-white transition hover:bg-ultra-claro"
                >
                  Ver o estoque completo
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
