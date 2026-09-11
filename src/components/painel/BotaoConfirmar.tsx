'use client'

import type { ComponentProps } from 'react'

/**
 * Botao de envio que pergunta antes. Pra acao sem volta, como remover foto:
 * no celular o dedo erra o alvo, e sem isto um toque torto apaga a foto.
 */
export function BotaoConfirmar({
  pergunta,
  ...props
}: ComponentProps<'button'> & { pergunta: string }) {
  return (
    <button
      type="submit"
      {...props}
      onClick={(e) => {
        if (!window.confirm(pergunta)) e.preventDefault()
      }}
    />
  )
}
