'use client'

import { useRef, useState, useTransition } from 'react'
import { adicionarFotosClientes } from '@/app/painel/acoes'
import { criarClienteNavegador } from '@/lib/supabase/navegador'
import { prepararImagem } from '@/lib/imagem-navegador'

/**
 * Botao de subir foto de cliente, pensado pro celular do Pietro na porta da
 * loja: escolhe uma ou varias da galeria e pronto, elas entram no fim do
 * carrossel.
 *
 * A foto e reduzida no aparelho e vai direto pro bucket. Depois que todas
 * sobem, uma unica acao grava as linhas, entao nao nasce foto pela metade no
 * site se a internet cair no meio.
 */

// Card do carrossel tem 280px de largura. 1080 cobre tela com densidade 3x
// com folga e mantem o arquivo perto de 150 KB.
const LARGURA_MAX = 1080
const ALTURA_MAX = 1440

export function EnviarFotosClientes() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progresso, setProgresso] = useState<{ feitas: number; total: number } | null>(null)
  const [erro, setErro] = useState('')
  const [salvando, iniciar] = useTransition()

  const ocupado = progresso !== null || salvando

  const escolher = async (lista: FileList | null) => {
    if (!lista?.length) return
    setErro('')

    const arquivos = Array.from(lista).slice(0, 30)
    const sb = criarClienteNavegador()
    const caminhos: string[] = []
    let falhas = 0

    setProgresso({ feitas: 0, total: arquivos.length })

    for (const arquivo of arquivos) {
      try {
        const blob = await prepararImagem(arquivo, LARGURA_MAX, ALTURA_MAX)
        const caminho = `painel/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
        const { error } = await sb.storage
          .from('clientes')
          .upload(caminho, blob, { contentType: 'image/webp', upsert: false })
        if (error) throw error
        caminhos.push(caminho)
      } catch {
        falhas++
      }
      setProgresso((p) => (p ? { ...p, feitas: p.feitas + 1 } : p))
    }

    setProgresso(null)
    if (inputRef.current) inputRef.current.value = ''

    if (caminhos.length === 0) {
      setErro('Nenhuma foto subiu. Confira a internet e tente de novo.')
      return
    }

    iniciar(async () => {
      const r = await adicionarFotosClientes(caminhos)
      if (r.erro) setErro(r.erro)
      else if (falhas > 0) {
        setErro(
          `${falhas} ${falhas === 1 ? 'foto não subiu' : 'fotos não subiram'}. As outras já estão no site.`,
        )
      }
    })
  }

  return (
    <div className="rounded-2xl border border-linha bg-carta p-5">
      <input
        ref={inputRef}
        id="fotos-clientes"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={(e) => escolher(e.target.files)}
        disabled={ocupado}
        className="sr-only"
      />

      <div className="flex flex-wrap items-center gap-4">
        <label
          htmlFor="fotos-clientes"
          aria-disabled={ocupado}
          className={`btn-toque inline-flex items-center gap-2 rounded-full bg-ultra px-6 py-3 font-semibold text-white hover:bg-ultra-claro ${
            ocupado ? 'pointer-events-none opacity-60' : 'cursor-pointer'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="size-5">
            <path d="M12 16V4m0 0-4 4m4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" strokeLinecap="round" />
          </svg>
          Adicionar fotos
        </label>

        <p className="text-sm text-tinta-fraca" aria-live="polite">
          {progresso
            ? `Enviando ${progresso.feitas} de ${progresso.total}...`
            : salvando
              ? 'Salvando...'
              : 'Pode escolher várias de uma vez. Elas entram no fim da fila.'}
        </p>
      </div>

      {erro && (
        <p role="alert" className="mt-3 text-sm text-ultra">
          {erro}
        </p>
      )}
    </div>
  )
}
