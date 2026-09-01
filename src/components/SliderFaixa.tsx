'use client'

import { useEffect, useState } from 'react'

/**
 * Controle de faixa com duas alcas na mesma trilha.
 *
 * Sao dois <input type="range"> empilhados. O do topo recebe o toque so na
 * alca (pointer-events nos thumbs), senao o de cima cobriria o de baixo e uma
 * das alcas ficaria impossivel de pegar.
 *
 * Nao dispara a busca a cada pixel arrastado: avisa o pai quando a pessoa
 * SOLTA. Arrastar recarregando a lista a cada quadro trava no celular.
 */

type Props = {
  min: number
  max: number
  passo: number
  valorMin: number
  valorMax: number
  formatar: (v: number) => string
  /** Rótulo mostrado quando o máximo está no fim da trilha. */
  rotuloSemLimite?: string
  aoSoltar: (min: number, max: number) => void
}

export function SliderFaixa({
  min,
  max,
  passo,
  valorMin,
  valorMax,
  formatar,
  rotuloSemLimite,
  aoSoltar,
}: Props) {
  const [a, setA] = useState(valorMin)
  const [b, setB] = useState(valorMax)

  // Reage a limpar filtros e ao botão voltar do navegador.
  useEffect(() => setA(valorMin), [valorMin])
  useEffect(() => setB(valorMax), [valorMax])

  const baixo = Math.min(a, b)
  const alto = Math.max(a, b)
  const pct = (v: number) => ((v - min) / (max - min)) * 100

  const soltar = () => aoSoltar(baixo, alto)

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2 text-sm">
        <span className="numeros-tabela font-medium text-tinta">{formatar(baixo)}</span>
        <span className="numeros-tabela font-medium text-tinta">
          {rotuloSemLimite && alto >= max ? rotuloSemLimite : formatar(alto)}
        </span>
      </div>

      <div className="relative h-6">
        {/* trilha */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-linha" />
        {/* trecho escolhido */}
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ultra"
          style={{ left: `${pct(baixo)}%`, right: `${100 - pct(alto)}%` }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={passo}
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
          onPointerUp={soltar}
          onKeyUp={soltar}
          onTouchEnd={soltar}
          aria-label="Valor mínimo"
          className="faixa absolute inset-x-0 top-0 h-6 w-full"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={passo}
          value={b}
          onChange={(e) => setB(Number(e.target.value))}
          onPointerUp={soltar}
          onKeyUp={soltar}
          onTouchEnd={soltar}
          aria-label="Valor máximo"
          className="faixa absolute inset-x-0 top-0 h-6 w-full"
        />
      </div>
    </div>
  )
}
