import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Em Next 16 o antigo `middleware` chama-se `proxy`.
 *
 * Duas funcoes aqui:
 *   1. renovar o cookie de sessao a cada request, senao a pessoa cai do painel
 *      no meio do trabalho quando o token expira
 *   2. barrar quem nao esta logado antes de a pagina do painel comecar a rodar
 *
 * O que ESTE arquivo NAO e: o controle de acesso do sistema. Ele e a primeira
 * porta, e sozinho nao vale. Cada Server Action revalida a sessao, e a RLS do
 * banco recusa a operacao mesmo que as duas falhem. Proxy sozinho como unica
 * defesa e o furo classico do A01 do OWASP.
 */
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request })

  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(lista) {
          for (const { name, value } of lista) {
            request.cookies.set(name, value)
          }
          resposta = NextResponse.next({ request })
          for (const { name, value, options } of lista) {
            resposta.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // getUser valida o token de verdade. getSession so le o cookie.
  const {
    data: { user },
  } = await sb.auth.getUser()

  const caminho = request.nextUrl.pathname
  const ehPainel = caminho.startsWith('/painel')
  const ehLogin = caminho === '/entrar'

  if (ehPainel && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/entrar'
    // Volta pra onde a pessoa queria ir depois de entrar, mas so aceita
    // caminho interno: `?destino=https://outrosite` seria redirect aberto.
    url.searchParams.set('destino', caminho)
    return NextResponse.redirect(url)
  }

  if (ehLogin && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/painel'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return resposta
}

export const config = {
  matcher: ['/painel/:path*', '/entrar'],
}
