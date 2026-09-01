import Link from 'next/link'
import { Hero } from '@/components/Hero'
import { CardVeiculo } from '@/components/CardVeiculo'
import { CarrosselClientes } from '@/components/CarrosselClientes'
import { Avaliacoes } from '@/components/Avaliacoes'
import { buscarConfig, buscarDestaques, buscarVendedores } from '@/lib/dados'
import { lerFotosDeClientes } from '@/lib/fotos-clientes'

// ISR: a home fica cacheada e se atualiza sozinha. Quando o painel salva um
// veiculo ele chama revalidatePath e a atualizacao e imediata.
export const revalidate = 300

/**
 * Ritmo da pagina, decidido pelo Felipe em 2026-08-28: as secoes alternam
 * clara e escura de cima a baixo, sem duas do mesmo tom seguidas.
 *
 *   01 hero .............. escuro (foto)
 *   02 estoque ........... claro
 *   03 clientes .......... escuro
 *   04 avaliacoes ........ claro
 *   05 diferenciais ...... escuro
 *   06 dados da loja ..... claro
 *   07 rodape ............ escuro
 *
 * Ao inserir secao nova, manter a alternancia: e o que da o ritmo da pagina.
 */

const PROVAS = [
  {
    titulo: 'Carros com procedência',
    texto: 'Documentação em dia e histórico verificado',
    icone: 'escudo',
  },
  {
    titulo: 'Revisados antes da entrega',
    texto: 'Inspeção completa para você rodar tranquilo',
    icone: 'lista',
  },
  {
    titulo: 'Pós-venda que atende',
    texto: 'Suporte próximo e soluções rápidas',
    icone: 'grafico',
  },
] as const

function Icone({ tipo }: { tipo: (typeof PROVAS)[number]['icone'] }) {
  const comum = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }
  if (tipo === 'escudo')
    return (
      <svg viewBox="0 0 24 24" {...comum} className="size-8">
        <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (tipo === 'lista')
    return (
      <svg viewBox="0 0 24 24" {...comum} className="size-8">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" strokeLinecap="round" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" {...comum} className="size-8">
      <path d="M7 13.5 9.5 16l3-3 2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 10.5 7 7l3 2 4-3 3 2.5 4-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 19h16" strokeLinecap="round" />
    </svg>
  )
}

export default async function Home() {
  const [config, vendedores, destaques, fotosClientes] = await Promise.all([
    buscarConfig(),
    buscarVendedores(),
    // Home mostra so uma amostra. O estoque inteiro fica em /veiculos.
    buscarDestaques(4),
    lerFotosDeClientes(),
  ])

  return (
    <>
      {/* 01 escuro */}
      <Hero vendedores={vendedores} />

      {/* 02 claro: o estoque, que e o que a pessoa veio ver */}
      <section aria-labelledby="destaques" className="bg-fundo">
        <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8 lg:py-20">
          <div className="sobe-ao-rolar max-w-2xl">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-ultra">
              <span className="h-px w-8 bg-ultra" />
              Estoque atual
            </p>
            <h2
              id="destaques"
              className="mt-3 font-display text-3xl uppercase leading-tight text-tinta lg:text-5xl"
            >
              Seu próximo carro está aqui.
            </h2>
            <p className="mt-2 text-tinta-fraca">
              Os melhores seminovos selecionados para você.
            </p>
          </div>

          {destaques.length > 0 ? (
            <div className="sobe-ao-rolar mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {destaques.map((v, i) => (
                <CardVeiculo
                  key={v.id}
                  veiculo={v}
                  financiamento={config.financiamento}
                  prioridade={i < 4}
                />
              ))}
            </div>
          ) : (
            <p className="mt-10 rounded-2xl border border-dashed border-linha bg-carta p-10 text-center text-tinta-fraca">
              Nenhum veículo publicado ainda. Cadastre o estoque no painel.
            </p>
          )}

          <div className="sobe-ao-rolar mt-12 flex justify-center">
            <Link
              href="/veiculos"
              className="botao-pulso inline-flex items-center gap-3 rounded-full bg-ultra px-10 py-5 font-display text-lg uppercase tracking-wide text-white transition hover:bg-ultra-claro sm:text-xl"
            >
              Ver todo o estoque
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="size-5"
              >
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 03 escuro: clientes que ja compraram */}
      <CarrosselClientes fotos={fotosClientes} />

      {/* 04 claro: avaliacoes do Google */}
      <Avaliacoes google={config.google} />

      {/* 05 escuro: diferenciais */}
      <section aria-label="Por que comprar na Ultra" className="bg-escuro">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-3 lg:px-8 lg:py-16">
          {PROVAS.map((p) => (
            <div key={p.titulo} className="flex gap-4 sm:flex-col lg:gap-4">
              <span className="shrink-0 text-ouro-claro">
                <Icone tipo={p.icone} />
              </span>
              <div>
                <h2 className="font-display text-lg uppercase leading-tight text-gelo">
                  {p.titulo}
                </h2>
                <p className="mt-1.5 text-sm text-gelo-fraco">{p.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 06 claro: dados da loja */}
      <section id="contato" aria-label="Informações da loja" className="bg-fundo py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="sobe-ao-rolar grid grid-cols-1 gap-8 rounded-2xl border border-linha bg-carta p-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h2 className="font-display text-sm uppercase tracking-wide text-tinta">Endereço</h2>
              <address className="mt-2 text-sm not-italic leading-relaxed text-tinta-fraca">
                {config.loja.endereco}
                <br />
                {config.loja.bairro}, {config.loja.cidade}, {config.loja.uf}
                <br />
                CEP {config.loja.cep}
              </address>
            </div>
            <div>
              <h2 className="font-display text-sm uppercase tracking-wide text-tinta">Telefone</h2>
              <a
                href={`tel:+55${config.loja.telefone}`}
                className="mt-2 block font-display text-2xl text-ultra"
              >
                {config.loja.telefone_exibicao}
              </a>
              <p className="text-sm text-tinta-fraca">Atendimento por telefone e WhatsApp</p>
            </div>
            <div>
              <h2 className="font-display text-sm uppercase tracking-wide text-tinta">
                Horário de funcionamento
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-tinta-fraca">
                Segunda a sexta: {config.horario.semana}
                <br />
                Sábado: {config.horario.sabado}
                <br />
                Domingo: {config.horario.domingo}
              </p>
            </div>
            <div>
              <h2 className="font-display text-sm uppercase tracking-wide text-tinta">
                Compra segura
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-tinta-fraca">
                Transparência, confiança e respeito com você, do primeiro contato ao
                pós-venda.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
