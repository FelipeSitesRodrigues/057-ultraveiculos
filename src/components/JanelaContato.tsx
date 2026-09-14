'use client'

import { useEffect, useRef, useState } from 'react'
import type { OrigemContato } from '@/lib/site'

export type DadosContato = {
  /** Mensagem que vai pro WhatsApp. O nome da pessoa entra na abertura no servidor. */
  mensagem: string
  origem: OrigemContato
  /** Carro do contato. E dele que o painel tira o nome do carro. */
  veiculoId?: string
  /** Vendedor escolhido ou responsavel pelo carro. Sem ele, entra no rodizio. */
  vendedorId?: string
  /** Titulo da janelinha, ex: "Falar sobre o Honda City". */
  titulo?: string
}

const GUARDADO = 'ultra:contato'

/** (11) 98765-4321 enquanto digita. Aceita numero colado com +55 na frente. */
function mascara(valor: string): string {
  let d = valor.replace(/\D/g, '')
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2)
  d = d.slice(0, 11)
  if (d.length <= 2) return d ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/**
 * Janelinha de contato: nome e WhatsApp antes de abrir a conversa.
 *
 * Pedido do Pietro (2026-09-14): ver no painel quem chamou, sobre qual carro e
 * pra qual vendedor foi. So o clique nao entrega isso, porque o WhatsApp nao
 * devolve nada pro site.
 *
 * E um <form> DE VERDADE, com POST pra /atendimento e target _blank, e nao um
 * fetch seguido de window.open: navegador de celular bloqueia janela aberta
 * depois de uma espera, e o envio nativo nao espera nada. Tambem funciona com
 * o JavaScript quebrado.
 *
 * Nome e telefone ficam guardados no aparelho da pessoa: quem volta pra falar
 * de outro carro nao digita de novo.
 */
export function JanelaContato({
  aberta,
  aoFechar,
  dados,
}: {
  aberta: boolean
  aoFechar: () => void
  dados: DadosContato
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const campoNome = useRef<HTMLInputElement>(null)
  const campoTelefone = useRef<HTMLInputElement>(null)
  const [erro, setErro] = useState('')

  // Os campos nao sao controlados pelo React: o valor guardado no aparelho so
  // existe no navegador, entao entra direto no campo quando a janela abre.
  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    if (aberta && !dialogo.open) {
      try {
        const salvo = JSON.parse(localStorage.getItem(GUARDADO) ?? 'null')
        if (salvo?.nome && campoNome.current && !campoNome.current.value) {
          campoNome.current.value = String(salvo.nome)
        }
        if (salvo?.telefone && campoTelefone.current && !campoTelefone.current.value) {
          campoTelefone.current.value = mascara(String(salvo.telefone))
        }
      } catch {
        // sem armazenamento, a pessoa digita
      }
      dialogo.showModal()
    } else if (!aberta && dialogo.open) {
      dialogo.close()
    }
  }, [aberta])

  const fechar = () => {
    setErro('')
    aoFechar()
  }

  const enviar = (e: React.FormEvent<HTMLFormElement>) => {
    const nome = campoNome.current?.value ?? ''
    const digitos = (campoTelefone.current?.value ?? '').replace(/\D/g, '')
    if (nome.trim().length < 2) {
      e.preventDefault()
      setErro('Escreva seu nome.')
      return
    }
    if (digitos.length < 10) {
      e.preventDefault()
      setErro('Confira o WhatsApp: precisa do DDD e do número.')
      return
    }
    try {
      localStorage.setItem(GUARDADO, JSON.stringify({ nome: nome.trim(), telefone: digitos }))
    } catch {
      // segue sem guardar
    }
    // Fecha depois que o envio ja saiu. O formulario continua na pagina, entao
    // fechar a janela nao cancela nada.
    setTimeout(fechar, 0)
  }

  const campo =
    'mt-1.5 w-full rounded-lg border border-linha bg-fundo px-3.5 py-3 text-base text-tinta placeholder:text-tinta-fraca focus:border-ultra focus:outline-none'

  return (
    <dialog
      ref={ref}
      onClose={fechar}
      // Toque fora do cartao fecha. O cartao cobre o dialog inteiro, entao o
      // alvo so e o proprio dialog quando o toque cai no fundo escurecido.
      onClick={(e) => {
        if (e.target === e.currentTarget) fechar()
      }}
      aria-labelledby="janela-contato-titulo"
      className="m-0 mt-auto w-full max-w-none bg-transparent p-0 text-left text-tinta backdrop:bg-black/65 backdrop:backdrop-blur-sm sm:m-auto sm:max-w-md"
    >
      <form
        method="post"
        action="/atendimento"
        target="_blank"
        onSubmit={enviar}
        // O aviso some quando a pessoa volta a digitar, senao continua dizendo
        // "confira o WhatsApp" em cima de um numero ja corrigido.
        onInput={() => erro && setErro('')}
        noValidate
        className="rounded-t-3xl bg-carta px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:rounded-3xl sm:p-7"
      >
        <input type="hidden" name="msg" value={dados.mensagem} />
        <input type="hidden" name="origem" value={dados.origem} />
        {dados.veiculoId && <input type="hidden" name="veiculo" value={dados.veiculoId} />}
        {dados.vendedorId && <input type="hidden" name="vendedor" value={dados.vendedorId} />}

        <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-linha sm:hidden" />

        <div className="flex items-start justify-between gap-4">
          <h2
            id="janela-contato-titulo"
            className="font-display text-xl uppercase leading-tight text-tinta"
          >
            {dados.titulo ?? 'Falar com um vendedor'}
          </h2>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="-mr-2 -mt-1 shrink-0 rounded-full p-2 text-tinta-fraca hover:text-tinta"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="mt-1 text-sm text-tinta-fraca">
          O vendedor já recebe a conversa com o seu nome.
        </p>

        {erro && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-ultra/40 bg-ultra/5 px-4 py-3 text-sm text-tinta"
          >
            {erro}
          </p>
        )}

        <label className="mt-5 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
            Seu nome
          </span>
          <input
            ref={campoNome}
            name="nome"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            autoCapitalize="words"
            enterKeyHint="next"
            placeholder="Como o vendedor te chama"
            className={campo}
          />
        </label>

        <label className="mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
            Seu WhatsApp
          </span>
          <input
            name="telefone"
            type="tel"
            ref={campoTelefone}
            onInput={(e) => {
              const campo = e.currentTarget
              campo.value = mascara(campo.value)
            }}
            required
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="send"
            placeholder="(11) 98765-4321"
            className={`${campo} numeros-tabela`}
          />
        </label>

        <button
          type="submit"
          className="btn-toque mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-zap px-6 py-4 text-base font-semibold text-white hover:bg-zap-escuro"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.25-4.36c0-4.53 3.7-8.23 8.23-8.23 2.2 0 4.26.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.22-8.24 8.22Z" />
          </svg>
          Continuar no WhatsApp
        </button>

        <p className="mt-3 text-center text-xs text-tinta-fraca">
          Seus dados ficam só com a equipe da Ultra.
        </p>
      </form>
    </dialog>
  )
}
