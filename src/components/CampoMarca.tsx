'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { MARCAS } from '@/lib/opcionais'
import { normalizarBusca } from '@/lib/dados'

/**
 * Campo de marca com filtro por digitacao.
 *
 * Sao 28 marcas: numa lista comum, achar a sua exige rolar. Aqui a pessoa
 * digita "a" e ve Audi; digita "b" e ve BMW e BYD. O filtro ignora acento,
 * entao "citroen" encontra "Citroën".
 *
 * `permitirLivre` muda quem manda:
 *   - LIGADO no formulario do cliente ("venda seu carro"), porque ali a marca
 *     e o carro DELE, e existe muito mais marca no mundo do que numa lista de
 *     28. Quem tem uma Porsche precisa conseguir escrever Porsche.
 *   - DESLIGADO no painel, onde o Leandro cadastra o estoque da loja. Ali a
 *     lista fechada e o que impede "Wolksvagem" e "Volkswagem" virarem duas
 *     marcas diferentes no filtro do site.
 *
 * Teclado: setas navegam, Enter escolhe, Esc fecha.
 */
export function CampoMarca({
  nome = 'marca',
  valorInicial = '',
  obrigatorio = false,
  permitirLivre = false,
  aoMudar,
}: {
  nome?: string
  valorInicial?: string
  obrigatorio?: boolean
  permitirLivre?: boolean
  aoMudar?: (v: string) => void
}) {
  const [texto, setTexto] = useState(valorInicial)
  const [escolhida, setEscolhida] = useState(valorInicial)
  const [aberto, setAberto] = useState(false)
  const [destacada, setDestacada] = useState(0)
  const caixaRef = useRef<HTMLDivElement>(null)
  const listaId = useId()

  const filtro = normalizarBusca(texto)

  /**
   * Quem COMECA com o que foi digitado vem primeiro.
   * Digitar "b" mostra BMW e BYD no topo, e nao Mercedes-Benz e Subaru, que so
   * tem a letra no meio. As do meio continuam logo abaixo, senao "benz" nao
   * acharia a Mercedes.
   */
  const visiveis = (() => {
    if (!filtro || texto === escolhida) return [...MARCAS]
    const comeca = MARCAS.filter((m) => normalizarBusca(m).startsWith(filtro))
    const contem = MARCAS.filter(
      (m) => !normalizarBusca(m).startsWith(filtro) && normalizarBusca(m).includes(filtro),
    )
    return [...comeca, ...contem]
  })()

  /** "porsche" digitado vira "Porsche" na mensagem que o vendedor recebe. */
  const arrumarCaixa = (v: string) =>
    v
      .trim()
      .split(/\s+/)
      .map((p) => (p.length > 2 ? p[0].toUpperCase() + p.slice(1) : p))
      .join(' ')

  const digitado = texto.trim()
  const jaExisteNaLista = MARCAS.some((m) => normalizarBusca(m) === filtro)
  const podeUsarLivre = permitirLivre && digitado.length >= 2 && !jaExisteNaLista

  const escolher = (m: string) => {
    setEscolhida(m)
    setTexto(m)
    setAberto(false)
    aoMudar?.(m)
  }

  useEffect(() => {
    const aoClicarFora = (e: MouseEvent) => {
      if (caixaRef.current?.contains(e.target as Node)) return
      setAberto(false)
      // Com digitação livre, o que a pessoa escreveu vira a resposta em vez de
      // sumir. Sem ela, texto que não virou escolha não fica no campo enganando.
      if (permitirLivre && digitado.length >= 2 && !jaExisteNaLista) {
        escolher(arrumarCaixa(digitado))
      } else {
        setTexto(escolhida)
      }
    }
    document.addEventListener('mousedown', aoClicarFora)
    return () => document.removeEventListener('mousedown', aoClicarFora)
  })

  const aoTeclar = (e: React.KeyboardEvent) => {
    // A opção "usar o que digitei" ocupa a última posição da lista.
    const total = visiveis.length + (podeUsarLivre ? 1 : 0)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAberto(true)
      setDestacada((i) => Math.min(i + 1, total - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setDestacada((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (!aberto) return
      e.preventDefault()
      if (podeUsarLivre && destacada >= visiveis.length) escolher(arrumarCaixa(digitado))
      else if (visiveis[destacada]) escolher(visiveis[destacada])
      else if (podeUsarLivre) escolher(arrumarCaixa(digitado))
    } else if (e.key === 'Escape') {
      setAberto(false)
      setTexto(escolhida)
    }
  }

  return (
    <div ref={caixaRef} className="relative">
      {/* Valor que o formulário envia. Com lista fechada é sempre um item dela;
          com digitação livre, pode ser o que a pessoa escreveu. */}
      <input type="hidden" name={nome} value={escolhida} />

      <input
        type="text"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={listaId}
        aria-autocomplete="list"
        autoComplete="off"
        required={obrigatorio && !escolhida}
        value={texto}
        placeholder={permitirLivre ? 'Digite a marca' : 'Digite ou escolha'}
        onChange={(e) => {
          setTexto(e.target.value)
          setAberto(true)
          setDestacada(0)
          if (e.target.value === '') {
            setEscolhida('')
            aoMudar?.('')
          }
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={aoTeclar}
        className="mt-1.5 w-full rounded-lg border border-linha bg-carta px-3.5 py-3 text-tinta placeholder:text-tinta-fraca"
      />

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
        className={`pointer-events-none absolute right-3 top-1/2 mt-0.5 size-4 -translate-y-1/2 text-tinta-fraca transition ${
          aberto ? 'rotate-180' : ''
        }`}
      >
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {aberto && (
        <ul
          id={listaId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-linha bg-carta py-1 shadow-lg"
        >
          {visiveis.map((m, i) => (
            <li key={m} role="option" aria-selected={m === escolhida}>
              <button
                type="button"
                onMouseEnter={() => setDestacada(i)}
                onClick={() => escolher(m)}
                className={`block w-full px-3.5 py-2.5 text-left text-sm transition ${
                  i === destacada ? 'bg-ultra text-white' : 'text-tinta hover:bg-fundo'
                }`}
              >
                {m}
              </button>
            </li>
          ))}

          {podeUsarLivre && (
            <li role="option" aria-selected={false} className="border-t border-linha">
              <button
                type="button"
                onMouseEnter={() => setDestacada(visiveis.length)}
                onClick={() => escolher(arrumarCaixa(digitado))}
                className={`block w-full px-3.5 py-2.5 text-left text-sm transition ${
                  destacada >= visiveis.length
                    ? 'bg-ultra text-white'
                    : 'text-tinta hover:bg-fundo'
                }`}
              >
                Usar <strong>{arrumarCaixa(digitado)}</strong>
              </button>
            </li>
          )}

          {visiveis.length === 0 && !podeUsarLivre && (
            <li className="px-3.5 py-2.5 text-sm text-tinta-fraca">
              {permitirLivre
                ? 'Continue digitando o nome da marca.'
                : 'Nenhuma marca com esse nome. Escolha “Outra”.'}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
