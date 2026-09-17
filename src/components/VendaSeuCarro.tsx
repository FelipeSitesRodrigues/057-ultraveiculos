'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArteDeFundo } from '@/components/ArteDeFundo'
import { EscolhaVenda } from '@/components/EscolhaVenda'
import { FormVenderCarro } from '@/components/FormVenderCarro'
import { opcaoDe, type Intencao } from '@/lib/venda'

/**
 * Conteudo da pagina "Venda seu carro".
 *
 * A pagina tem DOIS caminhos, e a primeira coisa que a pessoa ve e a escolha
 * entre eles, num bloco dividido no meio. Dali pra baixo, tudo obedece a
 * escolha: o titulo do formulario, o aviso embaixo do botao, os tres passos do
 * "como funciona" e a mensagem que chega no WhatsApp do vendedor.
 *
 * Por isso o estado vive AQUI e nao dentro do formulario: ele e da pagina
 * inteira, nao de um componente so.
 *
 * A pagina inteira e escura, ao contrario do resto do site: e a unica em que o
 * produto nao e o carro da loja, e sim a proposta. O card branco do formulario
 * e o unico ponto claro, entao ele puxa o olho sozinho.
 *
 * A estrategia veio do Pietro: o que a loja quer nao e receber ficha, e a
 * pessoa DENTRO da loja, porque quem chega pra vender muitas vezes sai
 * comprando. Por isso o ultimo passo e "traz o carro na loja" nos dois
 * caminhos e nao ha promessa de avaliacao online.
 */

function IconeTroca() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
      className="size-7"
    >
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4 7 8 4 8-4M12 11v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function VendaSeuCarro() {
  const [intencao, setIntencao] = useState<Intencao>('venda')
  const opcao = opcaoDe(intencao)

  // Escolher no bloco de cima leva pro formulario. Sem isso, no celular a
  // pessoa toca e a tela não muda de lugar, e escolha sem consequência visível
  // parece botão quebrado.
  const escolher = (i: Intencao) => {
    setIntencao(i)
    const alvo = document.getElementById('formulario')
    if (!alvo) return
    const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    alvo.scrollIntoView({ behavior: semMovimento ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <div className="bg-breu">
      {/* A ESCOLHA, antes de qualquer outra coisa. */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10">
          <ArteDeFundo
            celular="/img/vender-mobile"
            desktop="/img/vender-desktop"
            className="object-[68%_top] lg:object-right-top"
          />
          {/* Véu. O bloco de escolha ocupa a largura inteira e passa por cima
              do carro, então os painéis é que garantem a leitura do texto (têm
              fundo e desfoque próprios) e o véu pode ser mais leve no meio: é
              ali que o carro aparece, brilhando por trás do vidro. Véu pesado
              no meio deixava o celular todo preto e matava a arte. */}
          <div className="absolute inset-0 bg-gradient-to-t from-breu from-5% via-breu/55 to-breu/25 lg:bg-gradient-to-r lg:from-breu lg:from-20% lg:via-breu/55 lg:to-breu/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-breu via-transparent to-transparent" />
        </div>

        {/* Menos folga no alto do celular: sem o carro visível ali, a faixa
            entre o cabeçalho e o título virava um vazio preto. */}
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:pt-20 lg:px-8 lg:pb-20 lg:pt-32">
          <span aria-hidden className="revela block h-0.5 w-12 bg-ultra" />

          <h1 className="revela revela-1 mt-5 max-w-2xl font-display text-3xl uppercase leading-[0.95] text-gelo sm:text-5xl lg:text-6xl">
            Quer vender
            <span className="mt-1 block text-ultra">ou consignar?</span>
          </h1>

          <p className="revela revela-2 mt-4 max-w-lg text-sm leading-relaxed text-gelo-fraco sm:text-base lg:mt-6 lg:text-lg">
            São dois caminhos, e a Ultra faz os dois. Escolha o seu, conte o básico do
            carro e fale com um vendedor agora.
          </p>

          <div className="revela revela-3 mt-7 lg:mt-10">
            <EscolhaVenda intencao={intencao} aoEscolher={escolher} />
          </div>
        </div>
      </section>

      {/* O FORMULÁRIO. Título e aviso mudam com o caminho escolhido: pedir os
          mesmos quatro campos é igual nos dois, mas o que a loja vai fazer com
          o carro não é, e a pessoa precisa ver isso escrito. */}
      <section id="formulario" className="bg-escuro py-14 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)] lg:items-start lg:gap-14 lg:px-8">
          <div className="sobe-ao-rolar">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-ultra">
              <span className="h-px w-8 bg-ultra" />
              {opcao.chamada}
            </p>

            <h2 className="mt-4 max-w-xl font-display text-2xl uppercase leading-[1.05] text-gelo lg:text-4xl">
              {opcao.tituloForm}
            </h2>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-gelo-fraco lg:text-base">
              {opcao.subtituloForm}
            </p>

            <ul className="mt-6 hidden space-y-3 lg:block">
              {opcao.vantagens.map((v) => (
                <li key={v} className="flex gap-3 text-sm leading-snug text-gelo-fraco">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ultra" />
                  {v}
                </li>
              ))}
            </ul>
          </div>

          <FormVenderCarro
            intencao={intencao}
            aoMudarIntencao={setIntencao}
          />
        </div>
      </section>

      {/* COMO FUNCIONA, depois da ação. Quem já decidiu não precisa ler. */}
      <section className="bg-breu py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="sobe-ao-rolar">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-ultra">
              <span className="h-px w-8 bg-ultra" />
              Como funciona {intencao === 'consignacao' ? 'a consignação' : 'a venda'}
            </p>

            <h2 className="mt-4 max-w-2xl font-display text-2xl uppercase leading-[1.05] text-gelo lg:text-4xl">
              {opcao.passosTitulo}
            </h2>
          </div>

          {/* Três colunas no desktop: os passos são irmãos e de mesmo peso,
              então lado a lado leem mais rápido que empilhados. */}
          <ol className="sobe-ao-rolar mt-10 grid gap-0 lg:grid-cols-3 lg:gap-10">
            {opcao.passos.map((p, i) => (
              <li
                key={p.titulo}
                className={`flex gap-4 py-5 first:pt-0 lg:block lg:border-0 lg:py-0 ${
                  i < opcao.passos.length - 1 ? 'border-b border-white/10 lg:border-b-0' : ''
                }`}
              >
                <span className="numeros-tabela flex size-9 shrink-0 items-center justify-center rounded-full bg-ultra font-display text-lg leading-none text-white">
                  {i + 1}
                </span>
                <div className="lg:mt-4">
                  <h3 className="font-display text-base uppercase leading-tight text-gelo lg:text-lg">
                    {p.titulo}
                  </h3>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-gelo-fraco">
                    {p.texto}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="sobe-ao-rolar mt-12 flex items-start gap-5 rounded-2xl border border-white/10 bg-escuro-2/80 p-5 lg:p-6">
            <span className="hidden size-14 shrink-0 items-center justify-center rounded-full border border-ultra/40 text-ultra sm:flex">
              <IconeTroca />
            </span>
            <div>
              <h3 className="font-display text-base uppercase leading-tight text-gelo lg:text-lg">
                Também aceitamos na troca
              </h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-gelo-fraco">
                Se você quer trocar por um do nosso estoque, o seu carro entra como parte
                do pagamento e a diferença pode ser financiada.
              </p>
              <Link
                href="/veiculos"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ultra transition hover:gap-3 hover:text-ultra-claro"
              >
                Ver o estoque
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                  className="size-4"
                >
                  <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
