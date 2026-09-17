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
 * Next injeta.
 *
 * 'unsafe-inline' TAMBEM em script-src, e isso e uma concessao consciente.
 * O Next entrega a hidratacao do React em scripts INLINE (8 deles nesta
 * pagina). Sem 'unsafe-inline' o navegador bloqueia todos, o React nunca
 * hidrata e o site vira uma foto: galeria nao anda, filtro nao filtra, busca
 * nao abre. Foi exatamente o que aconteceu no primeiro deploy.
 *
 * A alternativa correta e nonce por request, gerado no proxy.ts. Ela NAO cabe
 * aqui sem trocar a arquitetura: nonce exige renderizacao dinamica (a doc do
 * Next e explicita), e estas paginas sao estaticas com ISR de proposito, que e
 * o que segura o tempo de resposta das paginas que recebem trafego pago.
 *
 * O que sustenta a decisao: NAO existe dangerouslySetInnerHTML neste projeto e
 * nao ha script de terceiros, entao todo texto passa pelo escape do React. E o
 * resto da politica continua valendo, que e o que importa depois de um XSS:
 * script de fora nao carrega ('self'), a pagina so fala com o Supabase
 * (connect-src), nao pode ser embutida em iframe e nao envia formulario pra
 * fora.
 */
const csp = [
  "default-src 'self'",
  // 'unsafe-eval' so em dev, pro hot reload do Turbopack
  process.env.NODE_ENV === 'development'
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${SUPABASE_HOST}`,
  "font-src 'self' data:",
  `connect-src 'self' https://${SUPABASE_HOST}`,
  "frame-src 'self' https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  // O formulario de contato posta em /atendimento, que redireciona pro
  // WhatsApp. O Chrome aplica form-action tambem ao redirecionamento, entao
  // sem o WhatsApp aqui o envio morre calado depois de gravar o contato.
  // wa.me responde com outro redirecionamento pra api.whatsapp.com.
  "form-action 'self' https://wa.me https://api.whatsapp.com",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

const nextConfig: NextConfig = {
  images: {
    // A Vercel NAO redimensiona imagem neste projeto. O plano Hobby da 5 mil
    // transformacoes por mes; em 2026-09-17 a cota estourou e a Vercel passou a
    // responder 402 em toda variacao fora do cache, entao as fotos dos carros
    // sumiram do site no ar. Cada foto vira ate 8 larguras x 2 formatos, e o
    // cache vence a cada 4 horas: um estoque de ~40 carros nao cabe na cota.
    // O peso e resolvido na origem: foto de carro e cliente ja sobe reduzida
    // pelo painel (`imagem-navegador.ts`) e as artes de /public/img tem versao
    // AVIF servida por <picture>. Remover esta linha so com plano pago.
    unoptimized: true,
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
