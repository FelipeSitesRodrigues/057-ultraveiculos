import { NextResponse, type NextRequest } from 'next/server'
import { criarClientePublico } from '@/lib/supabase/publico'
import { MENSAGEM_GERAL } from '@/lib/site'

/**
 * Porta unica de contato do site: decide o vendedor da vez e manda a pessoa
 * pro WhatsApp dele.
 *
 * Por que uma rota em vez de decidir na hora de montar a pagina: a home e o
 * catalogo ficam em cache pra carregar rapido, entao o vendedor escolhido
 * durante a montagem seria o MESMO pra todo mundo que visse aquela versao
 * da pagina. Aqui a decisao acontece no clique, uma pessoa por vez.
 *
 * Custo: um desvio de alguns milissegundos numa navegacao que ja ia acontecer.
 * A pagina em si nao fica mais pesada, e nada disso roda no carregamento.
 *
 * Se o banco nao responder, o visitante ainda vai pro WhatsApp do primeiro
 * vendedor ativo. Contato perdido por causa de rodizio seria o pior erro
 * possivel aqui.
 */
export const dynamic = 'force-dynamic'

const LIMITE_MENSAGEM = 900

export async function GET(request: NextRequest) {
  const sb = criarClientePublico()

  const cru = request.nextUrl.searchParams.get('msg')
  const mensagem = (cru?.trim() || MENSAGEM_GERAL).slice(0, LIMITE_MENSAGEM)

  let numero: string | null = null

  try {
    const { data } = await sb.rpc('proximo_vendedor')
    const vendedor = Array.isArray(data) ? data[0] : data
    if (vendedor?.whatsapp) numero = vendedor.whatsapp as string
  } catch {
    // cai no plano B abaixo
  }

  if (!numero) {
    const { data } = await sb
      .from('vendedores')
      .select('whatsapp')
      .eq('ativo', true)
      .order('ordem')
      .limit(1)
      .maybeSingle()
    numero = data?.whatsapp ?? null
  }

  if (!numero) {
    // Sem vendedor cadastrado nao ha pra onde mandar: volta pro contato.
    return NextResponse.redirect(new URL('/#contato', request.url))
  }

  const destino = `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`

  const resposta = NextResponse.redirect(destino)
  // Rodizio nao pode ser cacheado, senao todo mundo cai no mesmo vendedor.
  resposta.headers.set('Cache-Control', 'no-store, max-age=0')
  return resposta
}
