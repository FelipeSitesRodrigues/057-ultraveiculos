'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { VeiculoFoto } from '@/types/database'
import { urlDaFoto } from '@/lib/dados'

export function GaleriaVeiculo({
  fotos,
  titulo,
}: {
  fotos: VeiculoFoto[]
  titulo: string
}) {
  const ordenadas = [...fotos].sort((a, b) => a.ordem - b.ordem)
  const [atual, setAtual] = useState(0)

  if (ordenadas.length === 0) {
    return (
      <div className="flex aspect-4/3 items-center justify-center rounded-2xl border border-linha bg-carta text-tinta-fraca">
        Fotos em breve
      </div>
    )
  }

  const foto = ordenadas[atual]
  const anterior = () => setAtual((i) => (i === 0 ? ordenadas.length - 1 : i - 1))
  const proxima = () => setAtual((i) => (i === ordenadas.length - 1 ? 0 : i + 1))

  return (
    <div>
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-linha bg-carta">
        <Image
          key={foto.id}
          src={urlDaFoto(foto.path)}
          alt={foto.alt || `${titulo}, foto ${atual + 1} de ${ordenadas.length}`}
          fill
          priority
          quality={90}
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />

        {ordenadas.length > 1 && (
          <>
            <button
              type="button"
              onClick={anterior}
              aria-label="Foto anterior"
              className="btn-toque absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-escuro/70 text-gelo backdrop-blur hover:bg-escuro"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5 rotate-180">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={proxima}
              aria-label="Próxima foto"
              className="btn-toque absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-escuro/70 text-gelo backdrop-blur hover:bg-escuro"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p
              aria-live="polite"
              className="numeros-tabela absolute bottom-3 left-3 rounded-md bg-escuro/80 px-2.5 py-1 text-xs text-gelo"
            >
              {atual + 1} / {ordenadas.length}
            </p>
          </>
        )}
      </div>

      {ordenadas.length > 1 && (
        <ul className="trilha mt-3 flex gap-2 overflow-x-auto pb-1">
          {ordenadas.map((f, i) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setAtual(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === atual}
                className={`relative block size-16 shrink-0 overflow-hidden rounded-lg border-2 sm:size-20 ${
                  i === atual ? 'border-ultra' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={urlDaFoto(f.path)}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
