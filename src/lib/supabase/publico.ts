import { createClient } from '@supabase/supabase-js'

/**
 * Cliente de LEITURA PUBLICA, usado pelas paginas do site.
 *
 * Nao le nem escreve cookie de propósito. Cookie tornaria a pagina dinamica
 * e mataria o ISR, que e o que deixa o catalogo rapido. Aqui a sessao nunca
 * existe: tudo que este cliente enxerga e o que a RLS libera para o papel
 * anon, ou seja, veiculo publicado, foto de veiculo publicado, banner no ar,
 * vendedor ativo e config marcada como publica.
 *
 * Nunca use este cliente para escrever. Escrita so em Server Action do painel.
 */
export function criarClientePublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    throw new Error(
      'Faltam NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente.',
    )
  }

  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
