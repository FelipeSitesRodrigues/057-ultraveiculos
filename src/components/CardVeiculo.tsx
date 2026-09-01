import Image from 'next/image'
import Link from 'next/link'
import type { VeiculoPublicoComFotos } from '@/types/database'
import { capa } from '@/lib/dados'
import { ano, km, reais, tituloVeiculo } from '@/lib/formato'
import { parcelaAPartirDe } from '@/lib/parcela'
import type { ConfigFinanciamento } from '@/lib/dados'

type Props = {
  veiculo: VeiculoPublicoComFotos
  financiamento: ConfigFinanciamento
  prioridade?: boolean
}

export function CardVeiculo({ veiculo: v, financiamento, prioridade = false }: Props) {
  const foto = capa(v)
  const titulo = tituloVeiculo(v)
  const parcela = parcelaAPartirDe(v.preco_centavos, financiamento)

  return (
    <article className="card-sobe group relative flex flex-col overflow-hidden rounded-2xl border border-linha bg-carta">
      <div className="relative aspect-4/3 overflow-hidden bg-fundo">
        {foto ? (
          <Image
            src={foto}
            alt={titulo}
            fill
            priority={prioridade}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-tinta-fraca sm:text-sm">
            sem foto
          </div>
        )}

        {v.ano_modelo && (
          <span className="absolute left-2 top-2 rounded-md bg-escuro/90 px-1.5 py-0.5 text-[11px] font-semibold text-gelo sm:left-3 sm:top-3 sm:px-2 sm:py-1 sm:text-xs">
            {v.ano_modelo}
          </span>
        )}
        {v.destaque && (
          <span className="absolute right-2 top-2 rounded-md bg-ultra px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white sm:right-3 sm:top-3 sm:px-2 sm:py-1 sm:text-[11px]">
            Destaque
          </span>
        )}
      </div>

      {/* Dois por linha no celular: o cartao encolhe o texto, nao a informacao.
          Nada e escondido, so cabe mais apertado. */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="font-display text-sm leading-tight uppercase text-tinta sm:text-lg">
          <Link href={`/veiculos/${v.slug}`} className="after:absolute after:inset-0">
            {titulo}
          </Link>
        </h3>

        <p className="mt-1 text-xs text-tinta-fraca sm:mt-1.5 sm:text-sm">
          {ano(v.ano_fabricacao, v.ano_modelo)}
          {v.km !== null && <> · {km(v.km)}</>}
          <span className="hidden sm:inline">{v.cambio && <> · {v.cambio}</>}</span>
        </p>

        <div className="mt-3 border-t border-linha pt-2.5 sm:mt-4 sm:pt-3">
          <p className="numeros-tabela font-display text-lg text-ultra sm:text-2xl">
            {reais(v.preco_centavos)}
          </p>
          {parcela > 0 && (
            <p className="numeros-tabela mt-0.5 text-[11px] text-tinta-fraca sm:text-xs">
              ou {reais(parcela)}/mês
            </p>
          )}
        </div>

        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-tinta transition group-hover:text-ultra sm:mt-4 sm:text-sm">
          Ver detalhes
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </article>
  )
}
