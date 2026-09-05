'use client'

import { useActionState, useState } from 'react'
import { salvarVeiculo, type EstadoForm } from '@/app/painel/acoes'
import {
  CAMBIOS,
  CARROCERIAS,
  COMBUSTIVEIS,
  CORES,
  MARCAS,
  OPCIONAIS,
  STATUS_ROTULO,
} from '@/lib/opcionais'
import type { VeiculoInterno, Vendedor } from '@/types/database'
import { reais } from '@/lib/formato'
import { CampoDinheiro } from '@/components/painel/CampoDinheiro'
import { SeletorFotos } from '@/components/painel/SeletorFotos'

type Props = {
  veiculo?: VeiculoInterno | null
  vendedores: Vendedor[]
}

function Campo({
  rotulo,
  ajuda,
  children,
}: {
  rotulo: string
  ajuda?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
        {rotulo}
      </span>
      {children}
      {ajuda && <span className="mt-1 block text-xs text-tinta-fraca">{ajuda}</span>}
    </label>
  )
}

const entrada =
  'mt-1.5 w-full rounded-lg border border-linha bg-carta px-3 py-2.5 text-sm text-tinta'

export function FormVeiculo({ veiculo, vendedores }: Props) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(salvarVeiculo, {})

  const fin = veiculo?.veiculo_financeiro

  // Os tres valores ficam no estado pra caixa verde recalcular enquanto a
  // pessoa digita, sem esperar salvar.
  const [cPreco, setCPreco] = useState<number | null>(veiculo?.preco_centavos ?? null)
  const [cMinimo, setCMinimo] = useState<number | null>(fin?.minimo_centavos ?? null)
  const [cCusto, setCCusto] = useState<number | null>(fin?.custo_centavos ?? null)

  // Carro vendido ou arquivado nao volta pro site por descuido num checkbox:
  // volta por um botao explicito na pagina dele.
  const jaSaiu = veiculo?.status === 'vendido' || veiculo?.status === 'arquivado'

  const desconto = cPreco !== null && cMinimo !== null ? cPreco - cMinimo : null
  const lucro = cPreco !== null && cCusto !== null ? cPreco - cCusto : null
  const lucroNoPiso = cMinimo !== null && cCusto !== null ? cMinimo - cCusto : null

  return (
    <form action={acao} className="space-y-8">
      {veiculo && (
        <>
          <input type="hidden" name="id" value={veiculo.id} />
          <input type="hidden" name="status_atual" value={veiculo.status} />
        </>
      )}

      {estado.erro && (
        <p
          role="alert"
          className="rounded-lg border border-ultra/40 bg-ultra/5 px-4 py-3 text-sm text-tinta"
        >
          {estado.erro}
        </p>
      )}

      {/* Identificação */}
      <fieldset className="rounded-2xl border border-linha bg-carta p-6">
        <legend className="px-2 font-display text-lg uppercase text-tinta">
          O carro
        </legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Marca">
            <select name="marca" defaultValue={veiculo?.marca ?? ''} required className={entrada}>
              <option value="">Selecione</option>
              {MARCAS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Modelo" ajuda="Ex: Onix Plus">
            <input
              name="modelo"
              defaultValue={veiculo?.modelo ?? ''}
              required
              maxLength={80}
              className={entrada}
            />
          </Campo>

          <Campo rotulo="Versão" ajuda="Ex: 1.0 Turbo LTZ Aut. 4p">
            <input
              name="versao"
              defaultValue={veiculo?.versao ?? ''}
              maxLength={120}
              className={entrada}
            />
          </Campo>
        </div>

        {/* Um ano só, sem portas e sem final de placa: decisão do Felipe em
            2026-08-28. Menos campo é menos atrito pra quem cadastra 20 carros. */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Ano">
            <input
              name="ano"
              type="number"
              min={1900}
              max={2100}
              inputMode="numeric"
              defaultValue={veiculo?.ano_modelo ?? veiculo?.ano_fabricacao ?? ''}
              className={entrada}
              placeholder="2022"
            />
          </Campo>
          <Campo rotulo="Quilometragem">
            <input
              name="km"
              type="number"
              min={0}
              inputMode="numeric"
              defaultValue={veiculo?.km ?? ''}
              className={entrada}
              placeholder="48000"
            />
          </Campo>
          <Campo rotulo="Carroceria">
            <select name="carroceria" defaultValue={veiculo?.carroceria ?? ''} className={entrada}>
              <option value="">Selecione</option>
              {CARROCERIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Câmbio">
            <select name="cambio" defaultValue={veiculo?.cambio ?? ''} className={entrada}>
              <option value="">Selecione</option>
              {CAMBIOS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Combustível">
            <select name="combustivel" defaultValue={veiculo?.combustivel ?? ''} className={entrada}>
              <option value="">Selecione</option>
              {COMBUSTIVEIS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Cor">
            <select name="cor" defaultValue={veiculo?.cor ?? ''} className={entrada}>
              <option value="">Selecione</option>
              {CORES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </fieldset>

      {/* Preço e margem */}
      <fieldset className="rounded-2xl border border-linha bg-carta p-6">
        <legend className="px-2 font-display text-lg uppercase text-tinta">
          Preço e margem
        </legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Preço de venda" ajuda="É o que aparece no site">
            <CampoDinheiro
              nome="preco"
              obrigatorio
              valorInicial={veiculo?.preco_centavos}
              placeholder="98.900"
              aoMudar={setCPreco}
            />
          </Campo>

          <Campo rotulo="Preço mínimo" ajuda="Piso pra negociar. Nunca vai pro site.">
            <CampoDinheiro
              nome="minimo"
              valorInicial={fin?.minimo_centavos}
              placeholder="92.000"
              aoMudar={setCMinimo}
            />
          </Campo>

          <Campo rotulo="Custo" ajuda="Quanto a loja pagou. Nunca vai pro site.">
            <CampoDinheiro
              nome="custo"
              valorInicial={fin?.custo_centavos}
              placeholder="78.000"
              aoMudar={setCCusto}
            />
          </Campo>
        </div>

        {/* Prejuizo quase sempre e erro de digitacao (custo no lugar do preco).
            Melhor avisar na hora do que descobrir na hora de vender. */}
        {lucro !== null && lucro < 0 && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-ultra/40 bg-ultra/5 px-4 py-3 text-sm text-tinta"
          >
            Atenção: o custo está acima do preço de venda, então esse carro daria
            prejuízo de {reais(Math.abs(lucro))}. Confira os valores.
          </p>
        )}

        {/* Espelho da caixa verde da Belloni: o vendedor precisa saber o piso
            sem ter que fazer conta na frente do cliente. */}
        {(desconto !== null || lucro !== null) && (
          <div className="mt-5 rounded-xl border border-zap/30 bg-zap/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-tinta-fraca">
              Desconto liberado
            </p>
            {desconto !== null && cMinimo !== null && (
              <>
                <p className="numeros-tabela mt-1 font-display text-3xl text-tinta">
                  {reais(cMinimo)}
                </p>
                <p className="numeros-tabela mt-1 text-sm text-tinta-fraca">
                  Tabela {reais(cPreco!)} · até {reais(desconto)} de desconto. Não feche
                  abaixo desse valor sem aprovação.
                </p>
              </>
            )}
            {(lucro !== null || lucroNoPiso !== null) && (
              <dl className="numeros-tabela mt-4 grid grid-cols-2 gap-3 border-t border-zap/20 pt-4 text-sm sm:grid-cols-3">
                {lucro !== null && (
                  <div>
                    <dt className="text-tinta-fraca">Lucro na tabela</dt>
                    <dd className="font-medium text-tinta">{reais(lucro)}</dd>
                  </div>
                )}
                {lucroNoPiso !== null && (
                  <div>
                    <dt className="text-tinta-fraca">Lucro no piso</dt>
                    <dd className="font-medium text-tinta">{reais(lucroNoPiso)}</dd>
                  </div>
                )}
                {cCusto !== null && (
                  <div>
                    <dt className="text-tinta-fraca">Custo</dt>
                    <dd className="font-medium text-tinta">{reais(cCusto)}</dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        )}
      </fieldset>

      {/* Fotos */}
      <fieldset className="rounded-2xl border border-linha bg-carta p-6">
        <legend className="px-2 font-display text-lg uppercase text-tinta">Fotos</legend>
        <p className="mb-4 text-sm text-tinta-fraca">
          Pode mandar várias de uma vez, direto do celular. O site reduz e converte
          sozinho, então não precisa se preocupar com o tamanho. Depois de escolher,
          arraste a ordem com as setas: a primeira vira a capa.
        </p>

        <SeletorFotos />

        {veiculo && (
          <p className="mt-3 text-xs text-tinta-fraca">
            Estas entram depois das que o carro já tem. Pra mexer nas antigas, use a
            lista de fotos abaixo do formulário.
          </p>
        )}
      </fieldset>

      {/* Opcionais */}
      <fieldset className="rounded-2xl border border-linha bg-carta p-6">
        <legend className="px-2 font-display text-lg uppercase text-tinta">
          Opcionais
        </legend>
        <p className="text-sm text-tinta-fraca">Marque tudo que o carro tem.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {OPCIONAIS.map((o) => (
            <label
              key={o}
              className="cursor-pointer select-none rounded-full border border-linha px-3.5 py-2 text-sm text-tinta transition has-[:checked]:border-ultra has-[:checked]:bg-ultra has-[:checked]:text-white"
            >
              <input
                type="checkbox"
                name="opcionais"
                value={o}
                defaultChecked={veiculo?.opcionais?.includes(o)}
                className="sr-only"
              />
              {o}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Publicação */}
      <fieldset className="rounded-2xl border border-linha bg-carta p-6">
        <legend className="px-2 font-display text-lg uppercase text-tinta">
          Publicação
        </legend>

        {/* Uma decisao so: esta no site ou nao. Vendido e arquivado sao botoes
            na pagina do carro, porque acontecem depois do cadastro. */}
        {jaSaiu ? (
          <p className="rounded-xl border border-linha bg-fundo px-4 py-3 text-sm text-tinta">
            Este carro está como <strong>{STATUS_ROTULO[veiculo!.status]?.rotulo}</strong> e
            não aparece no site. Use os botões no fim da página para colocá-lo de volta.
            <input type="hidden" name="publicar" value="manter" />
          </p>
        ) : (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-linha p-4 transition has-[:checked]:border-zap has-[:checked]:bg-zap/5">
            <input
              type="checkbox"
              name="publicar"
              defaultChecked={veiculo ? veiculo.status === 'publicado' : true}
              className="mt-0.5 size-5 accent-zap"
            />
            <span>
              <span className="block font-medium text-tinta">Mostrar no site</span>
              <span className="block text-sm text-tinta-fraca">
                Desmarque para deixar o carro guardado aqui, só para a equipe, enquanto
                você termina de tirar as fotos ou fechar o preço.
              </span>
            </span>
          </label>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Vendedor responsável" ajuda="O botão do site vai direto pra ele">
            <select
              name="vendedor_id"
              defaultValue={veiculo?.vendedor_id ?? ''}
              className={entrada}
            >
              <option value="">Qualquer vendedor</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2.5 text-sm text-tinta">
            <input
              type="checkbox"
              name="destaque"
              defaultChecked={veiculo?.destaque}
              className="size-4"
            />
            Destaque: aparece na primeira parte da home (máximo 8)
          </label>
        </div>

        <div className="mt-5">
          <Campo rotulo="Descrição" ajuda="Aparece na página do carro">
            <textarea
              name="descricao"
              rows={5}
              maxLength={4000}
              defaultValue={veiculo?.descricao ?? ''}
              className={entrada}
              placeholder="Único dono, revisão em dia, laudo cautelar aprovado..."
            />
          </Campo>
        </div>
      </fieldset>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-linha bg-carta/95 p-4 backdrop-blur">
        <button
          type="submit"
          disabled={enviando}
          className="btn-toque rounded-full bg-ultra px-8 py-3.5 font-semibold text-white hover:bg-ultra-claro disabled:opacity-60"
        >
          {enviando ? 'Salvando...' : veiculo ? 'Salvar alterações' : 'Cadastrar carro'}
        </button>
        <p className="text-sm text-tinta-fraca">
          {enviando
            ? 'Enviando as fotos, pode demorar alguns segundos.'
            : 'Só aparece no site quando a situação estiver como Publicado.'}
        </p>
      </div>
    </form>
  )
}
