/**
 * Arte de fundo com uma versão pro celular e outra pro desktop.
 *
 * O <picture> escolhe UMA fonte pela largura da tela, então cada aparelho baixa
 * só a arte dele. Duas <Image> com `lg:hidden` / `hidden lg:block` baixariam as
 * duas: o truque de `sizes="1px"` que evitava isso dependia do srcset que a
 * Vercel gerava, e o next.config agora serve imagem sem otimizar.
 *
 * AVIF primeiro (qualidade 56, a mesma que a Vercel entregava), webp pra
 * navegador que não lê AVIF. `celular` e `desktop` são caminhos sem extensão, e
 * as duas extensões precisam existir em /public.
 */
export function ArteDeFundo({
  celular,
  desktop,
  className,
}: {
  celular: string
  desktop: string
  className: string
}) {
  return (
    <picture>
      <source media="(min-width: 1024px)" type="image/avif" srcSet={`${desktop}.avif`} />
      <source media="(min-width: 1024px)" type="image/webp" srcSet={`${desktop}.webp`} />
      <source type="image/avif" srcSet={`${celular}.avif`} />
      <img
        src={`${celular}.webp`}
        alt=""
        fetchPriority="high"
        className={`absolute inset-0 size-full object-cover ${className}`}
      />
    </picture>
  )
}
