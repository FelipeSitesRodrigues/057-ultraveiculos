'use client'

import { useActionState, useState } from 'react'
import { salvarBanner, type EstadoForm } from '@/app/painel/acoes'
import { criarClienteNavegador } from '@/lib/supabase/navegador'
import type { Banner } from '@/types/database'

/**
 * Troca do banner do topo do catalogo.
 *
 * Mesma logica das fotos de veiculo: a imagem e reduzida no navegador e vai
 * direto pro Storage, e o formulario envia so o caminho. Banner e arquivo
 * grande, e passar isso por Server Action esbarraria no limite de 1 MB.
 */
export function FormBanner({ banner }: { banner: Banner | null }) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(salvarBanner, {})
  const [previa, setPrevia] = useState<string | null>(null)
  const [caminho, setCaminho] = useState('')
  const [subindo, setSubindo] = useState(false)
  const [erro, setErro] = useState('')

  const escolher = async (arquivo: File | undefined) => {
    if (!arquivo) return
    setErro('')
    setSubindo(true)
    setPrevia(URL.createObjectURL(arquivo))

    try {
      const bitmap = await createImageBitmap(arquivo)
      // Banner e faixa larga: 2400px de largura cobre tela grande sem exagero.
      const escala = Math.min(1, 2400 / bitmap.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * escala)
      canvas.height = Math.round(bitmap.height * escala)
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      bitmap.close()

      const blob = await new Promise<Blob | null>((r) =>
        canvas.toBlob(r, 'image/webp', 0.9),
      )
      if (!blob) throw new Error('não consegui converter')

      const nome = `banner/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`
      const { error } = await criarClienteNavegador()
        .storage.from('banners')
        .upload(nome, blob, { contentType: 'image/webp' })
      if (error) throw error

      setCaminho(nome)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'falhou o envio')
      setPrevia(null)
    } finally {
      setSubindo(false)
    }
  }

  const atual = previa ?? (banner ? urlPublica(banner.imagem_path) : null)

  return (
    <form action={acao} className="space-y-6">
      {banner && <input type="hidden" name="id" value={banner.id} />}
      <input type="hidden" name="imagem_path" value={caminho} />

      {(estado.erro || erro) && (
        <p role="alert" className="rounded-lg border border-ultra/40 bg-ultra/5 px-4 py-3 text-sm text-tinta">
          {estado.erro || erro}
        </p>
      )}

      <div className="rounded-2xl border border-linha bg-carta p-6">
        <h2 className="font-display text-lg uppercase text-tinta">Imagem</h2>
        <p className="mt-1 text-sm text-tinta-fraca">
          Faixa larga, no formato de tarja. A que a gente gerou tem 1536 por 430.
          Evite texto pequeno: no celular a faixa encolhe.
        </p>

        {atual && (
          <div className="relative mt-4 h-28 w-full overflow-hidden rounded-xl bg-escuro sm:h-36 lg:h-44">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={atual} alt="Prévia do banner" className="size-full object-cover object-center" />
          </div>
        )}

        <label className="btn-toque mt-4 inline-block cursor-pointer rounded-full bg-ultra px-5 py-2.5 text-sm font-semibold text-white hover:bg-ultra-claro">
          {subindo ? 'Enviando...' : atual ? 'Trocar imagem' : 'Escolher imagem'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => escolher(e.target.files?.[0])}
          />
        </label>
      </div>

      <div className="rounded-2xl border border-linha bg-carta p-6">
        <h2 className="font-display text-lg uppercase text-tinta">Ajustes</h2>

        <label className="mt-4 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
            Descrição da imagem
          </span>
          <input
            name="titulo"
            defaultValue={banner?.titulo ?? ''}
            maxLength={120}
            placeholder="Ultra Veículos, seminovos com procedência"
            className="mt-1.5 w-full rounded-lg border border-linha bg-carta px-3 py-2.5 text-sm text-tinta"
          />
          <span className="mt-1 block text-xs text-tinta-fraca">
            Lido em voz alta por quem usa leitor de tela, e aparece se a imagem falhar.
          </span>
        </label>

        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={banner ? banner.ativo : true}
            className="size-5 accent-zap"
          />
          <span className="text-sm text-tinta">Mostrar no topo do estoque</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={enviando || subindo}
        className="btn-toque rounded-full bg-ultra px-8 py-3.5 font-semibold text-white hover:bg-ultra-claro disabled:opacity-60"
      >
        {enviando ? 'Salvando...' : 'Salvar banner'}
      </button>
    </form>
  )
}

function urlPublica(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/banners/${path}`
}
