'use client'

import { useState } from 'react'
import type { Vendedor } from '@/types/database'
import type { OrigemContato } from '@/lib/site'
import { JanelaContato } from '@/components/JanelaContato'

export function IconeWhats({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.25-4.36c0-4.53 3.7-8.23 8.23-8.23 2.2 0 4.26.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.22-8.24 8.22Z" />
    </svg>
  )
}

type Props = {
  /** Quando vazio, o contato entra no rodízio entre os vendedores ativos. */
  vendedores?: Vendedor[]
  /** Vendedor específico. Usado quando o carro tem responsável definido. */
  vendedor?: Vendedor | null
  mensagem: string
  rotulo?: string
  className?: string
  classeWrapper?: string
  origem?: OrigemContato
  veiculoId?: string
  /** Título da janelinha de contato. */
  tituloJanela?: string
}

/**
 * Botao de WhatsApp.
 *
 * Abre a janelinha de nome e WhatsApp (JanelaContato), que envia pra rota
 * /atendimento. La o contato e gravado pro painel e o vendedor e escolhido:
 * o responsavel pelo carro quando existe, senao o da vez no rodizio.
 *
 * Antes isso abria um menu pedindo pra pessoa escolher entre Adenilson e
 * Solon: uma pergunta que o visitante nao tem como responder.
 */
export function BotaoWhats({
  vendedores,
  vendedor,
  mensagem,
  rotulo = 'Falar no WhatsApp',
  className = '',
  classeWrapper = '',
  origem = 'site',
  veiculoId,
  tituloJanela,
}: Props) {
  const [aberta, setAberta] = useState(false)
  const base =
    'inline-flex w-full items-center justify-center gap-2 rounded-full bg-zap px-6 py-3 font-semibold text-white hover:bg-zap-escuro'

  // Sem ninguém cadastrado não há pra onde mandar.
  if (!vendedor && (!vendedores || vendedores.length === 0)) return null

  return (
    <div className={`relative ${classeWrapper}`}>
      <button
        type="button"
        onClick={() => setAberta(true)}
        aria-haspopup="dialog"
        className={`${base} ${className}`}
      >
        <IconeWhats />
        {rotulo}
      </button>
      <JanelaContato
        aberta={aberta}
        aoFechar={() => setAberta(false)}
        dados={{
          mensagem,
          origem,
          veiculoId,
          vendedorId: vendedor?.id,
          titulo: tituloJanela ?? (vendedor ? `Falar com ${vendedor.nome}` : undefined),
        }}
      />
    </div>
  )
}

/** Link "WhatsApp Solon" do rodapé: a pessoa escolheu o vendedor, então não há rodízio. */
export function LinkWhatsVendedor({
  vendedor,
  mensagem,
  className = '',
}: {
  vendedor: Vendedor
  mensagem: string
  className?: string
}) {
  const [aberta, setAberta] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setAberta(true)} aria-haspopup="dialog" className={className}>
        <IconeWhats className="size-4 text-zap" />
        WhatsApp {vendedor.nome}
      </button>
      <JanelaContato
        aberta={aberta}
        aoFechar={() => setAberta(false)}
        dados={{
          mensagem,
          origem: 'site',
          vendedorId: vendedor.id,
          titulo: `Falar com ${vendedor.nome}`,
        }}
      />
    </>
  )
}
