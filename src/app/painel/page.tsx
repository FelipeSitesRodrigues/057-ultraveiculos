import Link from 'next/link'
import { resumoDaLoja, listarVeiculos, listarVendedoresPainel } from '@/lib/painel'
import { sessaoDaEquipe } from '@/lib/supabase/servidor'
import { reais, tituloVeiculo } from '@/lib/formato'
import { diasNoEstoque } from '@/types/database'

export default async function VisaoGeral() {
  const [sessao, resumo, parados, vendedores] = await Promise.all([
    sessaoDaEquipe(),
    resumoDaLoja(),
    listarVeiculos('girar'),
    listarVendedoresPainel(),
  ])

  const cartoes = [
    {
      rotulo: 'Carros disponíveis',
      valor: String(resumo.disponiveis),
      apoio: 'publicados no site',
    },
    {
      rotulo: 'Valor de mercado',
      valor: reais(resumo.valorMercado),
      apoio: 'se vender tudo na tabela',
    },
    {
      rotulo: 'Patrimônio',
      valor: reais(resumo.patrimonio),
      apoio: 'custo do estoque em loja',
    },
    {
      rotulo: 'Sem margem definida',
      valor: String(resumo.semMargem),
      apoio: 'precisam de custo e mínimo',
      alerta: resumo.semMargem > 0,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl uppercase text-tinta">
          Olá, {sessao?.nome}
        </h1>
        <p className="mt-1 text-tinta-fraca">Visão geral do estoque e das vendas.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cartoes.map((c) => (
          <div
            key={c.rotulo}
            className={`rounded-2xl border bg-carta p-5 ${
              c.alerta ? 'border-ultra/40' : 'border-linha'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
              {c.rotulo}
            </p>
            <p
              className={`numeros-tabela mt-2 font-display text-3xl ${
                c.alerta ? 'text-ultra' : 'text-tinta'
              }`}
            >
              {c.valor}
            </p>
            <p className="mt-1 text-xs text-tinta-fraca">{c.apoio}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/painel/veiculos/novo"
          className="btn-toque flex items-center justify-center gap-2 rounded-2xl bg-ultra px-6 py-5 font-display text-lg uppercase text-white hover:bg-ultra-claro"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-5">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Adicionar carro
        </Link>
        <Link
          href="/painel/veiculos"
          className="flex items-center justify-between rounded-2xl border border-linha bg-carta px-6 py-5 transition hover:border-ultra"
        >
          <span className="font-medium text-tinta">Ver o estoque</span>
          <span className="numeros-tabela font-display text-2xl text-tinta">
            {resumo.disponiveis}
          </span>
        </Link>
        <Link
          href="/painel/leads"
          className="flex items-center justify-between rounded-2xl border border-linha bg-carta px-6 py-5 transition hover:border-ultra"
        >
          <span className="font-medium text-tinta">Contatos do site</span>
          <span
            className={`numeros-tabela font-display text-2xl ${
              resumo.leadsNovos > 0 ? 'text-ultra' : 'text-tinta'
            }`}
          >
            {resumo.leadsNovos}
          </span>
        </Link>
      </div>

      {/* Divisao dos contatos. O rodizio manda o proximo pra quem recebeu
          menos, entao a diferenca entre os dois nunca passa de um. */}
      {vendedores.length > 1 && (
        <section className="rounded-2xl border border-linha bg-carta p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg uppercase text-tinta">
              Contatos por vendedor
            </h2>
            <p className="text-sm text-tinta-fraca">
              O site alterna sozinho entre quem está ativo
            </p>
          </div>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {vendedores.map((v) => {
              const total = vendedores.reduce((s, x) => s + (x.atendimentos ?? 0), 0)
              const meu = v.atendimentos ?? 0
              const pct = total > 0 ? Math.round((meu / total) * 100) : 0
              return (
                <li key={v.id} className="rounded-xl border border-linha p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-base uppercase text-tinta">
                      {v.nome}
                    </span>
                    <span className="numeros-tabela font-display text-2xl text-tinta">
                      {meu}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-fundo"
                    role="img"
                    aria-label={`${pct}% dos contatos`}
                  >
                    <div className="h-full bg-ultra" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-tinta-fraca">
                    {v.ativo ? `${pct}% dos contatos` : 'inativo, fora do rodízio'}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-linha bg-carta">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linha p-5">
          <h2 className="font-display text-lg uppercase text-tinta">
            Carros parados há mais tempo
          </h2>
          <p className="text-sm text-tinta-fraca">Mais de 90 dias no estoque</p>
        </div>

        {parados.length === 0 ? (
          <p className="p-6 text-sm text-tinta-fraca">
            Nenhum carro parado há mais de 90 dias. Estoque girando bem.
          </p>
        ) : (
          <ul className="divide-y divide-linha">
            {parados.slice(0, 8).map((v) => (
              <li key={v.id}>
                <Link
                  href={`/painel/veiculos/${v.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 p-5 transition hover:bg-fundo"
                >
                  <div>
                    <p className="font-display text-sm uppercase text-tinta">
                      {tituloVeiculo(v)}
                    </p>
                    <p className="numeros-tabela text-xs text-tinta-fraca">
                      {v.ano_modelo} · {v.km?.toLocaleString('pt-BR')} km
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="numeros-tabela font-display text-lg text-tinta">
                      {reais(v.preco_centavos)}
                    </p>
                    <p className="numeros-tabela text-xs text-ultra">
                      {diasNoEstoque(v.entrou_em)} dias parado
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
