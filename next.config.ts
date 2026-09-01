import type { NextConfig } from 'next'

const SUPABASE_HOST = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://exemplo.supabase.co',
).hostname

/**
 * Content Security Policy.
 * Restringe de onde a pagina pode carregar coisa. Vale contra XSS: mesmo que
 * alguem consiga injetar um script, o navegador recusa executar de origem
 * que nao esta aqui.
 *
 * 'unsafe-inline' em style-src e necessario pro Tailwind e pros estilos que o
 * Next injeta. Em script-src ele NAO entra.
 */
const csp = [
  "default-src 'self'",
  // 'unsafe-eval' so em dev, pro hot reload do Turbopack
  process.env.NODE_ENV === 'development'
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${SUPABASE_HOST}`,
  "font-src 'self' data:",
  `connect-src 'self' https://${SUPABASE_HOST}`,
  "frame-src 'self' https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const nextConfig: NextConfig = {
  images: {
    // Fotos de veiculo e banner vem do Storage do Supabase.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: SUPABASE_HOST,
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // Next 16 passou a aceitar SO a qualidade 75 por padrao, e qualquer valor
    // fora da lista e arredondado pra ela. Num ceu de por do sol, que e
    // gradiente puro, 75 cria faixa visivel. O hero pede 90.
    qualities: [75, 90],
  },

  // Nao entregar o "X-Powered-By: Next.js": versao de framework e informacao
  // gratuita pra quem procura alvo.
  poweredByHeader: false,

  async redirects() {
    return [
      {
        // A página nasceu como /vender-meu-carro e virou /venda-seu-carro.
        // O redirecionamento protege qualquer link já compartilhado, e é o que
        // faz o Google entender que é a mesma página, e não uma nova.
        source: '/vender-meu-carro',
        destination: '/venda-seu-carro',
        permanent: true,
      },
    ]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      {
        // O painel nunca deve ser cacheado nem indexado.
        source: '/painel/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ]
  },
}

export default nextConfig
