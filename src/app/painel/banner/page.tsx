import Link from 'next/link'
import { FormBanner } from '@/components/painel/FormBanner'
import { criarClienteServidor } from '@/lib/supabase/servidor'
import type { Banner } from '@/types/database'

export default async function PainelBanner({ searchParams }: PageProps<'/painel/banner'>) {
  const sp = await searchParams
  const salvo = sp.salvo === '1'

  const sb = await criarClienteServidor()
  const { data } = await sb
    .from('banners')
    .select('id, titulo, imagem_path, link, ativo, ordem, inicia_em, termina_em')
    .order('ordem')
    .limit(1)
    .maybeSingle()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase text-tinta">Banner do estoque</h1>
        <p className="mt-1 text-tinta-fraca">
          A faixa que aparece no topo da página de estoque.{' '}
          <Link href="/veiculos" target="_blank" className="text-ultra hover:underline">
            Ver como está no site
          </Link>
        </p>
      </div>

      {salvo && (
        <p role="status" className="rounded-lg border border-zap/40 bg-zap/10 px-4 py-3 text-sm text-tinta">
          Banner salvo.
        </p>
      )}

      <FormBanner banner={(data as Banner) ?? null} />
    </div>
  )
}
