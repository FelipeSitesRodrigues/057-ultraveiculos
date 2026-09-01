'use client'

import { useState } from 'react'

/**
 * Campo de dinheiro que vai pontuando o milhar enquanto a pessoa digita:
 * 6 → 69 → 699 → 6.990 → 69.900.
 *
 * Sem centavos de proposito. Preco de carro em loja e sempre redondo, e pedir
 * ",00" em toda digitacao e atrito puro. O servidor entende os dois formatos.
 */

function pontuar(cru: string): string {
  const digitos = cru.replace(/\D/g, '').slice(0, 9)
  if (!digitos) return ''
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

type Props = {
  nome: string
  valorInicial?: number | null
  obrigatorio?: boolean
  placeholder?: string
  aoMudar?: (centavos: number | null) => void
}

export function CampoDinheiro({
  nome,
  valorInicial,
  obrigatorio,
  placeholder,
  aoMudar,
}: Props) {
  const [valor, setValor] = useState(
    valorInicial != null ? pontuar(String(Math.round(valorInicial / 100))) : '',
  )

  const digitou = (bruto: string) => {
    const formatado = pontuar(bruto)
    setValor(formatado)
    const digitos = formatado.replace(/\D/g, '')
    aoMudar?.(digitos ? Number(digitos) * 100 : null)
  }

  return (
    <div className="relative mt-1.5">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-tinta-fraca">
        R$
      </span>
      <input
        name={nome}
        value={valor}
        onChange={(e) => digitou(e.target.value)}
        required={obrigatorio}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        className="numeros-tabela w-full rounded-lg border border-linha bg-carta py-2.5 pl-10 pr-3 text-sm text-tinta"
      />
    </div>
  )
}
