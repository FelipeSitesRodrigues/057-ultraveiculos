import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente do PAINEL, com sessao em cookie.
 *
 * Usado so dentro de /painel e nas Server Actions. As paginas publicas usam
 * `criarClientePublico()`, que nao le cookie, porque cookie torna a pagina
 * dinamica e mata o cache do catalogo.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(lista) {
          try {
            for (const { name, value, options } of lista) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Server Component nao pode escrever cookie. Tudo bem: quem
            // renova a sessao e o proxy.
          }
        },
      },
    },
  )
}

export type Sessao = {
  userId: string
  email: string
  nome: string
  role: 'admin' | 'vendedor'
}

/**
 * Quem esta logado, e se ele faz parte da equipe.
 *
 * Sempre usa getUser(), que valida o token no servidor do Supabase.
 * getSession() le o cookie sem verificar assinatura, entao serve pra saber
 * "parece logado", nunca pra decidir permissao.
 *
 * Devolve null quando nao ha sessao ou quando o usuario nao tem perfil ativo.
 * Perfil desativado perde o acesso na hora, sem precisar apagar a conta.
 */
export async function sessaoDaEquipe(): Promise<Sessao | null> {
  const sb = await criarClienteServidor()

  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return null

  const { data: perfil } = await sb
    .from('perfis')
    .select('id, nome, role, ativo')
    .eq('id', user.id)
    .maybeSingle()

  if (!perfil || !perfil.ativo) return null

  return {
    userId: user.id,
    email: user.email ?? '',
    nome: perfil.nome || user.email?.split('@')[0] || 'equipe',
    role: perfil.role as 'admin' | 'vendedor',
  }
}
