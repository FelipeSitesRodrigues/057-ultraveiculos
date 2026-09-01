import type { Metadata } from 'next'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Entrar no painel',
  robots: { index: false, follow: false },
}

/** So aceita caminho interno. Sem isso, `?destino=https://...` vira phishing. */
function destinoSeguro(valor: string | undefined): string {
  if (!valor) return '/painel'
  if (!valor.startsWith('/') || valor.startsWith('//')) return '/painel'
  return valor
}

async function entrar(formData: FormData) {
  'use server'

  const email = String(formData.get('email') ?? '').trim()
  const senha = String(formData.get('senha') ?? '')
  const destino = destinoSeguro(String(formData.get('destino') ?? ''))

  if (!email || !senha) {
    redirect(`/entrar?erro=1&destino=${encodeURIComponent(destino)}`)
  }

  const cookieStore = await cookies()
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (lista) => {
          for (const { name, value, options } of lista) {
            cookieStore.set(name, value, options)
          }
        },
      },
    },
  )

  const { error } = await sb.auth.signInWithPassword({ email, password: senha })

  if (error) {
    // Mensagem unica pra e-mail errado e senha errada: resposta diferente
    // deixa descobrir quais e-mails existem no sistema.
    redirect(`/entrar?erro=1&destino=${encodeURIComponent(destino)}`)
  }

  redirect(destino)
}

export default async function Entrar({ searchParams }: PageProps<'/entrar'>) {
  const sp = await searchParams
  const erro = sp.erro === '1'
  const destino = destinoSeguro(typeof sp.destino === 'string' ? sp.destino : undefined)

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-escuro px-4 py-16">
      <div className="w-full max-w-sm">
        <Image
          src="/img/logo.webp"
          alt="Ultra Veículos"
          width={720}
          height={486}
          priority
          className="mx-auto h-14 w-auto"
        />

        <div className="mt-8 rounded-2xl border border-white/10 bg-escuro-2 p-7">
          <h1 className="font-display text-2xl uppercase text-gelo">Painel da loja</h1>
          <p className="mt-1 text-sm text-gelo-fraco">
            Acesso restrito à equipe da Ultra.
          </p>

          {erro && (
            <p
              role="alert"
              className="mt-5 rounded-lg border border-ultra/40 bg-ultra/10 px-4 py-3 text-sm text-gelo"
            >
              E-mail ou senha incorretos. Confira e tente de novo.
            </p>
          )}

          <form action={entrar} className="mt-6 space-y-4">
            <input type="hidden" name="destino" value={destino} />

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-gelo-fraco">
                E-mail
              </span>
              <input
                type="email"
                name="email"
                required
                autoComplete="username"
                autoFocus
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-escuro px-4 py-3 text-gelo placeholder:text-gelo-fraco/60"
                placeholder="voce@ultraveiculos.com.br"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-gelo-fraco">
                Senha
              </span>
              <input
                type="password"
                name="senha"
                required
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-escuro px-4 py-3 text-gelo"
              />
            </label>

            <button
              type="submit"
              className="btn-toque w-full rounded-full bg-ultra px-6 py-3.5 font-semibold text-white hover:bg-ultra-claro"
            >
              Entrar
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gelo-fraco">
          Esqueceu a senha? Fale com o administrador da loja.
        </p>
      </div>
    </div>
  )
}
