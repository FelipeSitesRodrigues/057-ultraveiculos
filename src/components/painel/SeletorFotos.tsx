'use client'

import { useEffect, useRef, useState } from 'react'
import { criarClienteNavegador } from '@/lib/supabase/navegador'
import { prepararImagem } from '@/lib/imagem-navegador'

/**
 * Escolha, ordem e envio das fotos.
 *
 * Duas decisoes que mudam a vida de quem cadastra 20 carros por semana:
 *
 * 1. A foto e REDIMENSIONADA NO PROPRIO CELULAR antes de subir. Uma foto de
 *    4 MB vira uns 300 KB, entao o envio no 4G da loja fica em segundos em vez
 *    de minutos, e nao gasta o pacote de dados do vendedor.
 *
 * 2. O arquivo vai DIRETO pro Storage, sem passar pelo nosso servidor. Server
 *    Action do Next aceita 1 MB por envio e a Vercel corta em 4,5 MB: mandar
 *    12 fotos por la simplesmente nao funciona. Aqui o formulario envia so os
 *    caminhos, que sao alguns bytes.
 */

const LARGURA_MAX = 1920
const ALTURA_MAX = 1440

type Item = {
  id: string
  nome: string
  previa: string
  estado: 'esperando' | 'enviando' | 'pronto' | 'erro'
  caminho?: string
  erro?: string
}

export function SeletorFotos({ nome = 'fotos_caminhos' }: { nome?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [itens, setItens] = useState<Item[]>([])
  // Pasta deste cadastro. Serve pra agrupar as fotos antes de o carro existir.
  const loteRef = useRef<string>('')
  if (!loteRef.current && typeof crypto !== 'undefined') {
    loteRef.current = crypto.randomUUID()
  }

  useEffect(() => {
    return () => itens.forEach((i) => URL.revokeObjectURL(i.previa))
    // limpeza so no desmonte
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const enviando = itens.some((i) => i.estado === 'enviando')

  const escolher = async (lista: FileList | null) => {
    if (!lista?.length) return
    const sb = criarClienteNavegador()

    for (const arquivo of Array.from(lista).slice(0, 30)) {
      const id = `${arquivo.name}-${arquivo.size}-${Math.random().toString(36).slice(2, 7)}`
      const previa = URL.createObjectURL(arquivo)
      setItens((a) => [...a, { id, nome: arquivo.name, previa, estado: 'enviando' }])

      try {
        const blob = await prepararImagem(arquivo, LARGURA_MAX, ALTURA_MAX)
        const caminho = `lote/${loteRef.current}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.webp`

        const { error } = await sb.storage
          .from('veiculos')
          .upload(caminho, blob, { contentType: 'image/webp', upsert: false })

        if (error) throw error

        setItens((a) =>
          a.map((i) => (i.id === id ? { ...i, estado: 'pronto', caminho } : i)),
        )
      } catch (e) {
        setItens((a) =>
          a.map((i) =>
            i.id === id
              ? {
                  ...i,
                  estado: 'erro',
                  erro: e instanceof Error ? e.message : 'falhou',
                }
              : i,
          ),
        )
      }
    }

    // Libera o input pra pessoa poder escolher o mesmo arquivo de novo.
    if (inputRef.current) inputRef.current.value = ''
  }

  const mover = (de: number, para: number) => {
    if (para < 0 || para >= itens.length) return
    setItens((a) => {
      const l = [...a]
      const [x] = l.splice(de, 1)
      l.splice(para, 0, x)
      return l
    })
  }

  const remover = (id: string) => {
    const item = itens.find((i) => i.id === id)
    if (item?.caminho) {
      // Tira do bucket também, pra não deixar arquivo órfão ocupando espaço.
      criarClienteNavegador().storage.from('veiculos').remove([item.caminho])
    }
    if (item) URL.revokeObjectURL(item.previa)
    setItens((a) => a.filter((i) => i.id !== id))
  }

  const prontas = itens.filter((i) => i.estado === 'pronto')

  return (
    <div>
      {/* O formulario envia so os caminhos, na ordem da tela. */}
      <input type="hidden" name={nome} value={JSON.stringify(prontas.map((i) => i.caminho))} />

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(e) => escolher(e.target.files)}
        className="sr-only"
        id="campo-fotos"
      />

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor="campo-fotos"
          className="btn-toque cursor-pointer rounded-full bg-ultra px-5 py-2.5 text-sm font-semibold text-white hover:bg-ultra-claro"
        >
          Escolher fotos
        </label>
        <p className="text-sm text-tinta-fraca" aria-live="polite">
          {itens.length === 0
            ? 'Nenhuma foto escolhida'
            : enviando
              ? `Enviando... ${prontas.length} de ${itens.length}`
              : `${prontas.length} ${prontas.length === 1 ? 'foto pronta' : 'fotos prontas'}, a primeira é a capa`}
        </p>
      </div>

      {itens.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {itens.map((f, i) => (
            <li key={f.id} className="overflow-hidden rounded-xl border border-linha bg-fundo">
              <div className="relative aspect-4/3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.previa}
                  alt={`Prévia de ${f.nome}`}
                  className="absolute inset-0 size-full object-cover"
                />

                {f.estado === 'enviando' && (
                  <span className="absolute inset-0 flex items-center justify-center bg-escuro/60 text-xs font-semibold text-gelo">
                    enviando...
                  </span>
                )}
                {f.estado === 'erro' && (
                  <span className="absolute inset-0 flex items-center justify-center bg-ultra/80 p-2 text-center text-[11px] font-semibold text-white">
                    não subiu
                  </span>
                )}
                {f.estado === 'pronto' && (
                  <span
                    className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                      i === 0 ? 'bg-ultra text-white' : 'bg-escuro/80 text-gelo'
                    }`}
                  >
                    {i === 0 ? 'Capa' : i + 1}
                  </span>
                )}
              </div>

              <div className="flex divide-x divide-linha border-t border-linha">
                <button
                  type="button"
                  onClick={() => mover(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`Mover ${f.nome} para trás`}
                  className="flex-1 py-2 text-tinta transition hover:bg-carta disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="mx-auto size-4 rotate-180">
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => mover(i, i + 1)}
                  disabled={i === itens.length - 1}
                  aria-label={`Mover ${f.nome} para frente`}
                  className="flex-1 py-2 text-tinta transition hover:bg-carta disabled:opacity-30"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="mx-auto size-4">
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => remover(f.id)}
                  aria-label={`Tirar ${f.nome} da lista`}
                  className="flex-1 py-2 text-ultra transition hover:bg-ultra/5"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="mx-auto size-4">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {itens.some((i) => i.estado === 'erro') && (
        <p role="alert" className="mt-3 text-sm text-ultra">
          Alguma foto não subiu. Tire ela da lista com o X e tente escolher de novo.
        </p>
      )}
    </div>
  )
}
