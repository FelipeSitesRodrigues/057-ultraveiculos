import Image from 'next/image'
import Link from 'next/link'
import type { Vendedor } from '@/types/database'
import { ROTAS, MENSAGEM_GERAL } from '@/lib/site'
import { LinkWhatsVendedor } from '@/components/BotaoWhats'
import type { ConfigFinanciamento, ConfigGoogle, ConfigHorario, ConfigLoja } from '@/lib/dados'

type Props = {
  config: {
    loja: ConfigLoja
    horario: ConfigHorario
    google: ConfigGoogle
    financiamento: ConfigFinanciamento
  }
  vendedores: Vendedor[]
}

export function Footer({ config, vendedores }: Props) {
  const { loja, horario } = config
  const ano = new Date().getFullYear()

  return (
    <footer className="bg-breu text-gelo">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Image
              src="/img/logo.webp"
              alt="Ultra Veículos"
              width={720}
              height={486}
              className="h-12 w-auto"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gelo-fraco">
              Seminovos com procedência conferida, revisados antes de sair da loja e
              pós-venda que atende de verdade.
            </p>
            <div className="filete-ouro mt-5 h-px w-28" />
          </div>

          <nav aria-label="Rodapé">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gelo-fraco">
              Navegação
            </h2>
            <ul className="mt-4 space-y-2.5">
              {ROTAS.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="text-sm text-gelo transition hover:text-ultra-claro">
                    {r.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gelo-fraco">
              Contato
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:+55${loja.telefone}`}
                  className="font-display text-xl transition hover:text-ultra-claro"
                >
                  {loja.telefone_exibicao}
                </a>
              </li>
              {vendedores.map((v) => (
                <li key={v.id}>
                  <LinkWhatsVendedor
                    vendedor={v}
                    mensagem={MENSAGEM_GERAL}
                    className="inline-flex items-center gap-2 text-gelo transition hover:text-zap"
                  />
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gelo-fraco">
              Onde estamos
            </h2>
            <address className="mt-4 space-y-1 text-sm not-italic text-gelo-fraco">
              <p className="text-gelo">{loja.endereco}</p>
              <p>
                {loja.bairro}, {loja.cidade}, {loja.uf}
              </p>
              <p>CEP {loja.cep}</p>
            </address>
            <div className="mt-4 space-y-1 text-sm text-gelo-fraco">
              <p>
                <span className="text-gelo">Seg a Sex</span> {horario.semana}
              </p>
              <p>
                <span className="text-gelo">Sábado</span> {horario.sabado}
              </p>
              <p>
                <span className="text-gelo">Domingo</span> {horario.domingo}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-gelo-fraco sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {ano} {loja.nome}. Todos os direitos reservados.
          </p>
          <Link href="/politica-de-privacidade" className="transition hover:text-gelo">
            Política de privacidade
          </Link>
        </div>
      </div>
    </footer>
  )
}
