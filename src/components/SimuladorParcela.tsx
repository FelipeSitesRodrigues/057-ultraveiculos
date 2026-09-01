'use client'

import { useMemo, useState } from 'react'
import { calcularParcela } from '@/lib/parcela'
import { reais, reaisExatos } from '@/lib/formato'
import type { ConfigFinanciamento } from '@/lib/dados'

type Props = {
  precoCentavos: number
  cfg: ConfigFinanciamento
  /** Link de WhatsApp já montado, pra pessoa sair daqui falando com vendedor. */
  linkWhats?: string
}

/**
 * Simulacao roda inteira no navegador: e conta de tres linhas, nao precisa de
 * servidor, e responde enquanto a pessoa arrasta.
 *
 * O aviso embaixo nao e enfeite juridico. Parcela publicada sem ele passa a
 * ser oferta de credito, que e atividade regulada.
 */
export function SimuladorParcela({ precoCentavos, cfg, linkWhats }: Props) {
  const entradaMinima = Math.round(precoCentavos * cfg.entrada_min_pct)
  const [entrada, setEntrada] = useState(entradaMinima)
  const [prazo, setPrazo] = useState(cfg.prazo_padrao)

  const r = useMemo(
    () =>
      calcularParcela({
        precoCentavos,
        entradaCentavos: entrada,
        prazo,
        taxaAoMes: cfg.taxa_am,
      }),
    [precoCentavos, entrada, prazo, cfg.taxa_am],
  )

  const prazos = useMemo(() => {
    const lista = [12, 24, 36, 48, 60, 72].filter((p) => p <= cfg.prazo_max)
    return lista.length ? lista : [cfg.prazo_max]
  }, [cfg.prazo_max])

  return (
    <section
      aria-labelledby="simulador"
      className="rounded-2xl border border-linha bg-carta p-6"
    >
      <h2 id="simulador" className="font-display text-xl uppercase text-tinta">
        Simule sua parcela
      </h2>

      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="entrada" className="text-sm text-tinta-fraca">
            Entrada
          </label>
          <output
            htmlFor="entrada"
            className="numeros-tabela font-display text-lg text-tinta"
          >
            {reais(entrada)}
          </output>
        </div>
        <input
          id="entrada"
          type="range"
          min={entradaMinima}
          max={Math.round(precoCentavos * 0.9)}
          step={50000}
          value={entrada}
          onChange={(e) => setEntrada(Number(e.target.value))}
          className="mt-2 w-full accent-ultra"
        />
        <p className="numeros-tabela mt-1 text-xs text-tinta-fraca">
          Entrada mínima de {reais(entradaMinima)}
        </p>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm text-tinta-fraca">Prazo</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {prazos.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrazo(p)}
              aria-pressed={prazo === p}
              className={`btn-toque rounded-full px-4 py-2 text-sm font-medium ${
                prazo === p
                  ? 'bg-ultra text-white'
                  : 'border border-linha text-tinta hover:border-ultra hover:text-ultra'
              }`}
            >
              {p}x
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 rounded-xl bg-fundo p-5">
        <p className="text-sm text-tinta-fraca">Parcela estimada</p>
        <p className="numeros-tabela mt-1 font-display text-4xl text-ultra">
          {reaisExatos(r.parcelaCentavos)}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-linha pt-4 text-sm">
          <div>
            <dt className="text-tinta-fraca">Valor financiado</dt>
            <dd className="numeros-tabela font-medium text-tinta">
              {reais(r.financiadoCentavos)}
            </dd>
          </div>
          <div>
            <dt className="text-tinta-fraca">Taxa usada</dt>
            <dd className="numeros-tabela font-medium text-tinta">
              {(cfg.taxa_am * 100).toFixed(2).replace('.', ',')}% ao mês
            </dd>
          </div>
        </dl>
      </div>

      {linkWhats && (
        <a
          href={linkWhats}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-toque mt-5 flex w-full items-center justify-center rounded-full bg-zap px-6 py-3.5 font-semibold text-white hover:bg-zap-escuro"
        >
          Enviar essa simulação no WhatsApp
        </a>
      )}

      <p className="mt-4 text-xs leading-relaxed text-tinta-fraca">{cfg.aviso}</p>
    </section>
  )
}
