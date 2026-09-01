import Link from 'next/link'
import { FormVeiculo } from '@/components/painel/FormVeiculo'
import { listarVendedoresPainel } from '@/lib/painel'

export default async function NovoVeiculo() {
  const vendedores = await listarVendedoresPainel()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/painel/veiculos" className="text-sm text-tinta-fraca hover:text-ultra">
          ← Voltar ao estoque
        </Link>
        <h1 className="mt-3 font-display text-3xl uppercase text-tinta">Adicionar carro</h1>
        <p className="mt-1 text-tinta-fraca">
          Preencha o que souber agora. Dá pra completar depois.
        </p>
      </div>

      <FormVeiculo vendedores={vendedores} />
    </div>
  )
}
