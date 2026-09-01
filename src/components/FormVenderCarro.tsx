'use client'

import { useState } from 'react'
import { CampoMarca } from '@/components/CampoMarca'
import { OPCOES_VENDA, opcaoDe, type Intencao } from '@/lib/venda'

/**
 * Formulario de "quero vender / quero consignar".
 *
 * O objetivo, dito pelo Pietro: trazer a pessoa ate a loja. Quem chega pra
 * vender muitas vezes sai comprando, entao a conversa vale mais que o
 * formulario. Por isso ele e curto e termina no WhatsApp, com tudo escrito.
 *
 * A INTENCAO vem de fora (do bloco dividido no topo da pagina), nao daqui.
 * Aqui ela aparece de novo como um seletor pequeno: quem rolou ate o
 * formulario e mudou de ideia troca sem ter que subir a pagina de volta. Os
 * dois controles mexem no mesmo estado, entao nunca discordam.
 *
 * Nao pede foto (decisao do Pietro) e nao promete valor: avaliacao de carro
 * usado se faz olhando o carro. Prometer numero pela internet e criar
 * expectativa que a loja vai ter que desfazer na frente do cliente.
 *
 * Nao pede WhatsApp: a mensagem sai PELO WhatsApp da pessoa, entao o numero
 * chega junto. Pedir de novo seria pedir duas vezes a mesma coisa.
 */

const ANO_ATUAL = new Date().getFullYear()
const ANOS = Array.from({ length: ANO_ATUAL + 1 - 1990 + 1 }, (_, i) => ANO_ATUAL + 1 - i)

export function FormVenderCarro({
  whatsUrlBase,
  intencao,
  aoMudarIntencao,
}: {
  whatsUrlBase: string
  intencao: Intencao
  aoMudarIntencao: (i: Intencao) => void
}) {
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [ano, setAno] = useState('')
  const [km, setKm] = useState('')
  const [nome, setNome] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const kmFormatado = km ? Number(km.replace(/\D/g, '')).toLocaleString('pt-BR') : ''
  const opcao = opcaoDe(intencao)

  const montarMensagem = () => {
    // Os dados do carro montados como bloco. O nome só entra na lista se
    // existir: antes ele virava linha vazia na mensagem quando ficava em
    // branco, e o vendedor recebia um buraco no meio do texto.
    const dados = [
      `*Carro:* ${marca} ${modelo}`.trim(),
      `*Ano:* ${ano}`,
      `*Quilometragem:* ${kmFormatado} km`,
    ]
    if (nome.trim()) dados.push(`*Meu nome:* ${nome.trim()}`)

    // A primeira e a última linha mudam com a intenção: o vendedor entende o
    // que a pessoa quer já na notificação, sem precisar abrir e perguntar.
    return [
      opcao.abertura,
      '',
      `*Quero:* ${intencao === 'consignacao' ? 'deixar em consignação' : 'vender agora'}`,
      ...dados,
      '',
      opcao.fecho,
    ].join('\n')
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!marca || !modelo || !ano || !km) {
      setErro('Preencha marca, modelo, ano e quilometragem.')
      return
    }
    setErro('')
    setEnviando(true)
    window.location.href = `${whatsUrlBase}${encodeURIComponent(montarMensagem())}`
  }

  const campo =
    'mt-1.5 w-full rounded-lg border border-linha bg-carta px-3.5 py-3 text-tinta placeholder:text-tinta-fraca'

  return (
    // Único bloco claro da página. Num fundo todo preto, o branco puxa o olho
    // sozinho: não precisa de seta nem de "preencha abaixo".
    <form
      onSubmit={enviar}
      className="rounded-3xl bg-carta p-6 shadow-[0_24px_60px_-20px_rgb(0_0_0_/_0.9)] lg:p-8"
    >
      {erro && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-ultra/40 bg-ultra/5 px-4 py-3 text-sm text-tinta"
        >
          {erro}
        </p>
      )}

      {/* Espelho da escolha feita lá em cima. Aqui ele é pequeno de propósito:
          a pergunta já foi feita, isto é só o lugar de mudar de ideia sem ter
          que rolar a página de volta. */}
      <fieldset className="mb-5">
        <legend className="text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
          Você quer
        </legend>
        <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-full bg-fundo p-1">
          {OPCOES_VENDA.map((op) => (
            <label
              key={op.valor}
              className={`cursor-pointer rounded-full px-3 py-2 text-center text-xs font-semibold leading-tight transition sm:text-sm ${
                intencao === op.valor
                  ? 'bg-ultra text-white'
                  : 'text-tinta-fraca hover:text-tinta'
              }`}
            >
              <input
                type="radio"
                name="intencao"
                value={op.valor}
                checked={intencao === op.valor}
                onChange={() => aoMudarIntencao(op.valor)}
                className="sr-only"
              />
              {op.valor === 'consignacao' ? 'Consignar' : 'Vender'}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Dois por linha desde o celular, como no mockup. Os rótulos são curtos
          e os campos são de escolha, então cabem: o que não cabe em coluna
          estreita é campo de texto longo, e aqui só o modelo é digitado. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
            Marca
          </span>
          <CampoMarca valorInicial={marca} obrigatorio permitirLivre aoMudar={setMarca} />
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
            Modelo
          </span>
          <input
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            required
            maxLength={60}
            placeholder="Ex: Onix, HB20"
            className={campo}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
            Ano
          </span>
          <select value={ano} onChange={(e) => setAno(e.target.value)} required className={campo}>
            <option value="">Selecione</option>
            {ANOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
            Quilometragem
          </span>
          <input
            value={kmFormatado}
            onChange={(e) => setKm(e.target.value)}
            required
            inputMode="numeric"
            placeholder="Ex: 45.000"
            className={`${campo} numeros-tabela`}
          />
        </label>
      </div>

      {/* Sem campo de WhatsApp: a pessoa vai mandar mensagem PELO WhatsApp
          dela, entao o numero chega junto. Pedir de novo e pedir duas vezes a
          mesma coisa (decisao do Felipe em 2026-08-30). O nome fica porque
          entra na mensagem e faz o vendedor abrir a conversa chamando pelo
          nome. */}
      <label className="mt-5 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
          Seu nome <span className="font-normal normal-case">(opcional)</span>
        </span>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={80}
          placeholder="Como o vendedor deve te chamar"
          className={campo}
        />
      </label>

      <button
        type="submit"
        disabled={enviando}
        className="btn-toque mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-zap px-8 py-4 text-lg font-semibold text-white hover:bg-zap-escuro disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-6">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.25-4.36c0-4.53 3.7-8.23 8.23-8.23 2.2 0 4.26.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.22-8.24 8.22Z" />
        </svg>
        {enviando ? 'Abrindo o WhatsApp...' : 'Falar com um vendedor'}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-tinta-fraca">{opcao.aviso}</p>
    </form>
  )
}
