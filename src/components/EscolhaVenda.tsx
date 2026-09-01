'use client'

import { OPCOES_VENDA, type Intencao } from '@/lib/venda'

/**
 * O bloco dividido no meio: metade "vender", metade "consignar".
 *
 * DUAS COLUNAS EM QUALQUER LARGURA, inclusive no celular. Empilhado, o segundo
 * caminho cairia abaixo da dobra num aparelho curto, e quem entrasse na pagina
 * veria so metade da oferta da loja. Como as duas metades sao a MESMA pergunta,
 * elas precisam ser vistas juntas ou a escolha nao existe.
 *
 * O preco de caber lado a lado no celular e a lista de vantagens, que so aparece
 * dentro dos paineis a partir do desktop. No celular ela vai pra fora do bloco,
 * mostrando so as do caminho escolhido: assim o toque tem resposta visivel e
 * nenhuma informacao se perde.
 *
 * A metade inteira e o botao, nao um link dentro dela: no celular, alvo de toque
 * grande e a diferenca entre acertar e errar.
 */

function IconeDinheiro() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="size-full">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" strokeLinecap="round" />
    </svg>
  )
}

function IconeVitrine() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="size-full">
      <path d="M3 9h18l-1.2-4.2A1.5 1.5 0 0 0 18.36 4H5.64a1.5 1.5 0 0 0-1.44 1.08L3 9Z" strokeLinejoin="round" />
      <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" strokeLinejoin="round" />
      <path d="M9.5 20v-5.5h5V20" strokeLinejoin="round" />
    </svg>
  )
}

const ICONES = { venda: IconeDinheiro, consignacao: IconeVitrine }

function Confere() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden className="size-3.5">
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function EscolhaVenda({
  intencao,
  aoEscolher,
}: {
  intencao: Intencao
  aoEscolher: (i: Intencao) => void
}) {
  const escolhida = OPCOES_VENDA.find((o) => o.valor === intencao) ?? OPCOES_VENDA[0]

  return (
    <div>
      <div className="relative grid grid-cols-2 overflow-hidden rounded-2xl border border-white/12 bg-escuro/55 backdrop-blur-md sm:rounded-3xl">
        {OPCOES_VENDA.map((op) => {
          const ativa = op.valor === intencao
          const vermelha = op.valor === 'venda'
          const Icone = ICONES[op.valor]

          return (
            <button
              key={op.valor}
              type="button"
              onClick={() => aoEscolher(op.valor)}
              aria-pressed={ativa}
              className={`group relative flex flex-col p-4 text-left transition sm:p-6 lg:p-8 ${
                op.valor === 'consignacao' ? 'border-l border-white/12' : ''
              } ${
                vermelha
                  ? 'bg-gradient-to-b from-ultra/25 via-ultra/8 to-transparent'
                  : 'bg-gradient-to-b from-white/10 via-white/[0.03] to-transparent'
              } ${
                ativa
                  ? vermelha
                    ? 'shadow-[inset_0_0_0_2px_var(--color-ultra)]'
                    : 'shadow-[inset_0_0_0_2px_var(--color-ouro)]'
                  : 'hover:bg-white/[0.06]'
              }`}
            >
              {/* Selo de escolhido. Fica no canto e nao empurra nada quando
                  aparece, porque a caixa dele existe sempre. */}
              <span
                className={`absolute right-3 top-3 flex size-6 items-center justify-center rounded-full transition sm:right-4 sm:top-4 ${
                  ativa
                    ? vermelha
                      ? 'bg-ultra text-white'
                      : 'bg-ouro text-escuro'
                    : 'scale-75 border border-white/20 text-transparent'
                }`}
              >
                <Confere />
              </span>

              <span
                className={`size-7 sm:size-8 ${vermelha ? 'text-ultra' : 'text-ouro-claro'}`}
              >
                <Icone />
              </span>

              <h3 className="mt-3 pr-7 font-display text-lg uppercase leading-[1.05] text-gelo sm:mt-4 sm:text-2xl lg:text-3xl">
                {op.rotulo}
              </h3>

              <p
                className={`mt-1.5 text-xs font-semibold leading-snug sm:mt-2 sm:text-sm ${
                  vermelha ? 'text-ultra' : 'text-ouro-claro'
                }`}
              >
                {op.chamada}
              </p>

              <p className="mt-2 text-xs leading-snug text-gelo-fraco sm:text-sm sm:leading-relaxed">
                {op.resumo}
              </p>

              {/* Vantagens so no desktop: no celular elas iriam pra fora da
                  largura util de uma coluna de 170px. */}
              <ul className="mt-5 hidden space-y-2 lg:block">
                {op.vantagens.map((v) => (
                  <li key={v} className="flex gap-2.5 text-sm leading-snug text-gelo-fraco">
                    <span
                      aria-hidden
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                        vermelha ? 'bg-ultra' : 'bg-ouro'
                      }`}
                    />
                    {v}
                  </li>
                ))}
              </ul>

              {/* mt-auto gruda o botao no rodape do painel: as duas metades tem
                  a mesma altura no grid, entao os dois botoes ficam na mesma
                  linha mesmo com textos de tamanhos diferentes. */}
              <span className="mt-auto block pt-5 sm:pt-6">
                <span
                  className={`btn-toque flex w-full items-center justify-center rounded-full px-3 py-2.5 text-center text-xs font-semibold leading-tight sm:text-sm lg:px-5 lg:py-3 lg:text-base ${
                    vermelha
                      ? 'bg-ultra text-white group-hover:bg-ultra-claro'
                      : 'bg-gelo text-escuro group-hover:bg-white'
                  }`}
                >
                  {op.botao}
                </span>
              </span>
            </button>
          )
        })}

        {/* O "ou" pousa exatamente sobre a divisoria: as duas metades sao
            colunas de mesma largura e mesma altura, entao o centro do bloco E o
            meio da linha, em qualquer largura de tela.
            SO A PARTIR DE 640px: no celular o painel tem 16px de folga interna
            e o disco avanca 22px pra dentro de cada lado, entao ele passava por
            cima do texto. Conferido no print antes de esconder. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 hidden size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-escuro text-xs font-semibold uppercase tracking-wider text-gelo-fraco sm:flex"
        >
          ou
        </span>
      </div>

      {/* Celular: as vantagens do caminho escolhido, fora do bloco. Tambem e a
          resposta ao toque, porque confirma por escrito o que a pessoa marcou. */}
      <ul className="mt-4 space-y-2 lg:hidden">
        {escolhida.vantagens.map((v) => (
          <li key={v} className="flex gap-2.5 text-sm leading-snug text-gelo-fraco">
            <span
              aria-hidden
              className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                escolhida.valor === 'venda' ? 'bg-ultra' : 'bg-ouro'
              }`}
            />
            {v}
          </li>
        ))}
      </ul>
    </div>
  )
}
