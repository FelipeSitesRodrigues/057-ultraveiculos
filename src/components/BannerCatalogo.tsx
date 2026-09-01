import Image from 'next/image'
import Link from 'next/link'
import type { Banner } from '@/types/database'
import { urlDaFoto } from '@/lib/dados'

/**
 * Faixa do topo do catalogo, no espirito da que o Pietro mostrou no Cockpit.
 *
 * A altura e fixa e a imagem entra com object-cover: banner com altura
 * proporcional a largura vira uma tira de 40px no celular, ilegivel. Aqui a
 * faixa mantem corpo em qualquer tela e a arte se acomoda dentro dela.
 *
 * `priority` porque ela e a primeira coisa visivel do catalogo: carregar
 * preguicosamente faria a lista pular quando a imagem chegasse.
 */
export function BannerCatalogo({ banner }: { banner: Banner | null }) {
  if (!banner) return null

  const imagem = (
    <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-escuro sm:h-36 lg:h-44">
      <Image
        src={urlDaFoto(banner.imagem_path, 'banners')}
        alt={banner.titulo || 'Ultra Veículos'}
        fill
        priority
        quality={90}
        sizes="(max-width: 1280px) 100vw, 1280px"
        className="object-cover object-center"
      />
    </div>
  )

  if (banner.link) {
    return (
      <Link href={banner.link} className="block transition hover:opacity-95">
        {imagem}
      </Link>
    )
  }

  return imagem
}
