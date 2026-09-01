import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente do navegador, usado SO pra enviar foto direto pro Storage.
 *
 * Por que o upload nao passa pelo nosso servidor:
 *   - Server Action do Next aceita 1 MB por envio, e 12 fotos de celular
 *     passam disso fácil
 *   - mesmo aumentando o limite, a Vercel corta o corpo da requisicao em
 *     4,5 MB, entao funcionaria aqui e quebraria no ar
 *   - passar 50 MB por uma funcao de servidor pra ela repassar pro Storage e
 *     desperdicio: o arquivo faz uma volta a toa
 *
 * A escrita continua protegida: as policies do bucket exigem sessao de equipe,
 * e o proprio bucket recusa o que nao for imagem e o que passar de 10 MB.
 * Ou seja, quem valida e o servidor do Supabase, nao o navegador.
 */
export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
