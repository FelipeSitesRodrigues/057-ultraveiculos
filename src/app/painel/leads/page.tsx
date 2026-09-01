import { listarLeads } from '@/lib/painel'
import { telefone } from '@/lib/formato'
import { linkWhatsApp } from '@/lib/site'

export default async function Leads() {
  const leads = await listarLeads()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase text-tinta">Contatos do site</h1>
        <p className="mt-1 text-tinta-fraca">
          Quem preencheu formulário no site. O mais novo vem primeiro.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-linha bg-carta p-12 text-center">
          <p className="font-display text-xl uppercase text-tinta">Nenhum contato ainda</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-tinta-fraca">
            Assim que alguém preencher um formulário no site, o contato aparece aqui.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha bg-carta">
          {leads.map((l) => (
            <li key={l.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="font-display text-sm uppercase text-tinta">{l.nome}</p>
                <p className="numeros-tabela text-sm text-tinta-fraca">
                  {telefone(l.telefone)}
                </p>
                {l.mensagem && (
                  <p className="mt-2 max-w-prose text-sm text-tinta">{l.mensagem}</p>
                )}
                <p className="mt-2 text-xs text-tinta-fraca">
                  {new Date(l.criado_em).toLocaleString('pt-BR')} · via {l.origem}
                </p>
              </div>
              <a
                href={linkWhatsApp(
                  l.telefone.startsWith('55') ? l.telefone : `55${l.telefone}`,
                  `Olá, ${l.nome.split(' ')[0]}! Aqui é da Ultra Veículos, vi seu contato pelo site.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-toque shrink-0 rounded-full bg-zap px-5 py-2.5 text-sm font-semibold text-white hover:bg-zap-escuro"
              >
                Responder
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
