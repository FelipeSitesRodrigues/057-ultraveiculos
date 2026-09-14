import Link from 'next/link'
import { listarLeads } from '@/lib/painel'
import { telefone, tituloVeiculo } from '@/lib/formato'
import { linkWhatsApp, ROTULO_ORIGEM } from '@/lib/site'

// Quem manda no fuso e o servidor, e na Vercel ele roda em UTC: sem isto, um
// contato das 15h aparece como 18h.
const quando = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export default async function Leads() {
  const leads = await listarLeads()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase text-tinta">Contatos do site</h1>
        <p className="mt-1 text-tinta-fraca">
          Quem chamou no WhatsApp pelo site, sobre qual carro e pra qual vendedor foi. O mais
          novo vem primeiro.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-linha bg-carta p-12 text-center">
          <p className="font-display text-xl uppercase text-tinta">Nenhum contato ainda</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-tinta-fraca">
            Assim que alguém tocar no WhatsApp do site e deixar o nome, o contato aparece aqui.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha bg-carta">
          {leads.map((l) => {
            const carro = l.veiculos
            const nomeCarro = carro
              ? `${tituloVeiculo(carro)}${carro.ano_modelo ? ` ${carro.ano_modelo}` : ''}`
              : null
            return (
              <li key={l.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-display text-base uppercase text-tinta">{l.nome}</p>
                  <p className="numeros-tabela text-sm text-tinta-fraca">{telefone(l.telefone)}</p>

                  <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                    <dt className="text-tinta-fraca">Carro</dt>
                    <dd className="text-tinta">
                      {nomeCarro ? (
                        carro?.status === 'publicado' ? (
                          <Link
                            href={`/veiculos/${carro.slug}`}
                            target="_blank"
                            className="font-medium underline decoration-linha underline-offset-4 hover:text-ultra"
                          >
                            {nomeCarro}
                          </Link>
                        ) : (
                          <span className="font-medium">{nomeCarro}</span>
                        )
                      ) : (
                        <span className="text-tinta-fraca">Nenhum carro específico</span>
                      )}
                    </dd>
                    <dt className="text-tinta-fraca">Vendedor</dt>
                    <dd className="font-medium text-tinta">
                      {l.vendedores?.nome ?? <span className="font-normal text-tinta-fraca">Não registrado</span>}
                    </dd>
                  </dl>

                  {/* Só a mensagem do "Venda seu carro" traz informação nova (o carro
                      que a pessoa quer vender). Nas outras ela repete o carro de cima. */}
                  {l.origem === 'vender-meu-carro' && l.mensagem && (
                    <p className="mt-3 max-w-prose whitespace-pre-line rounded-lg bg-fundo p-3 text-sm text-tinta">
                      {l.mensagem.replace(/\*/g, '')}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-tinta-fraca">
                    {quando.format(new Date(l.criado_em))} · {ROTULO_ORIGEM[l.origem] ?? l.origem}
                  </p>
                </div>
                <a
                  href={linkWhatsApp(
                    // Pelo tamanho, e nao por "comeca com 55": 55 tambem e DDD do RS.
                    l.telefone.length <= 11 ? `55${l.telefone}` : l.telefone,
                    `Olá, ${l.nome.split(' ')[0]}! Aqui é da Ultra Veículos, vi seu contato pelo site.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-toque shrink-0 rounded-full bg-zap px-5 py-2.5 text-sm font-semibold text-white hover:bg-zap-escuro"
                >
                  Responder
                </a>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
