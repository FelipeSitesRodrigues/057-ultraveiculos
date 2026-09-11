'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { criarClienteServidor, sessaoDaEquipe } from '@/lib/supabase/servidor'
import { gerarSlug } from '@/lib/formato'

/**
 * Toda escrita do sistema passa por aqui.
 *
 * Tres regras, nesta ordem:
 *   1. sessao revalidada em TODA acao (nunca confiar so no proxy)
 *   2. entrada validada por schema antes de tocar no banco
 *   3. a RLS do banco recusa de novo, mesmo que 1 e 2 falhem
 */

async function exigirEquipe() {
  const sessao = await sessaoDaEquipe()
  if (!sessao) redirect('/entrar?destino=/painel')
  return sessao
}

/** "R$ 98.900,00", "98900", "98.900" viram centavos. Aceita o que a pessoa digita. */
function paraCentavos(entrada: FormDataEntryValue | null): number | null {
  const cru = String(entrada ?? '').trim()
  if (!cru) return null
  const limpo = cru.replace(/[^\d,.-]/g, '')
  if (!limpo) return null
  // Formato brasileiro: ponto e milhar, virgula e decimal.
  const normalizado = limpo.replace(/\./g, '').replace(',', '.')
  const n = Number.parseFloat(normalizado)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

function inteiro(entrada: FormDataEntryValue | null): number | null {
  const n = Number.parseInt(String(entrada ?? '').replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? n : null
}

function texto(entrada: FormDataEntryValue | null): string {
  return String(entrada ?? '').trim()
}

const STATUS = ['rascunho', 'preparacao', 'publicado', 'vendido', 'arquivado'] as const

const EsquemaVeiculo = z.object({
  marca: z.string().min(1, 'Informe a marca').max(60),
  modelo: z.string().min(1, 'Informe o modelo').max(80),
  versao: z.string().max(120).default(''),
  status: z.enum(STATUS),
  destaque: z.boolean(),
  premium: z.boolean(),
  ano_fabricacao: z.number().int().min(1900).max(2100).nullable(),
  ano_modelo: z.number().int().min(1900).max(2100).nullable(),
  km: z.number().int().min(0).max(2_000_000).nullable(),
  preco_centavos: z.number().int().min(0, 'Informe o preço'),
  cambio: z.string().max(40).nullable(),
  combustivel: z.string().max(40).nullable(),
  cor: z.string().max(40).nullable(),
  portas: z.number().int().min(2).max(6).nullable(),
  carroceria: z.string().max(40).nullable(),
  placa_final: z.number().int().min(0).max(9).nullable(),
  descricao: z.string().max(4000).default(''),
  opcionais: z.array(z.string().max(60)).max(60),
  vendedor_id: z.string().uuid().nullable(),
  custo_centavos: z.number().int().min(0).nullable(),
  minimo_centavos: z.number().int().min(0).nullable(),
})

export type EstadoForm = { erro?: string; ok?: string }

function lerFormulario(fd: FormData) {
  const nulo = (v: string) => (v === '' ? null : v)

  // O formulario tem UM campo de ano (decisao do Felipe). Ele grava em
  // ano_modelo, que e o que o site exibe. As colunas de fabricacao, portas e
  // final de placa continuam no banco pra nao perder o que ja foi cadastrado,
  // mas nao sao mais preenchidas por aqui.
  const ano = inteiro(fd.get('ano'))

  // O formulario nao tem lista de situacao: tem um interruptor de "mostrar no
  // site". Vendido e arquivado sao mudados por acao propria, e nesse caso o
  // formulario manda "manter" pra nao reescrever o estado sem querer.
  const publicar = texto(fd.get('publicar'))
  const statusAtual = texto(fd.get('status_atual'))
  const status =
    publicar === 'manter' && statusAtual
      ? statusAtual
      : publicar === 'on'
        ? 'publicado'
        : 'rascunho'

  return EsquemaVeiculo.safeParse({
    marca: texto(fd.get('marca')),
    modelo: texto(fd.get('modelo')),
    versao: texto(fd.get('versao')),
    status,
    destaque: fd.get('destaque') === 'on',
    premium: fd.get('premium') === 'on',
    ano_fabricacao: null,
    ano_modelo: ano,
    km: inteiro(fd.get('km')),
    preco_centavos: paraCentavos(fd.get('preco')) ?? 0,
    cambio: nulo(texto(fd.get('cambio'))),
    combustivel: nulo(texto(fd.get('combustivel'))),
    cor: nulo(texto(fd.get('cor'))),
    portas: null,
    carroceria: nulo(texto(fd.get('carroceria'))),
    placa_final: null,
    descricao: texto(fd.get('descricao')),
    opcionais: fd.getAll('opcionais').map((o) => String(o).slice(0, 60)),
    vendedor_id: nulo(texto(fd.get('vendedor_id'))),
    custo_centavos: paraCentavos(fd.get('custo')),
    minimo_centavos: paraCentavos(fd.get('minimo')),
  })
}

/**
 * Traduz o erro cru do banco pro que a pessoa precisa fazer.
 *
 * O trigger `veiculos_limita_destaques` levanta a palavra `limite_destaques`.
 * Sem isto, o Leandro veria "Nao foi possivel salvar: limite_destaques" e nao
 * teria como adivinhar que precisa desmarcar outro carro.
 */
function mensagemDoBanco(bruta: string): string {
  if (bruta.includes('limite_destaques')) {
    return 'Você já tem 8 carros em destaque, que é o limite da home. Tire o destaque de outro carro antes de marcar este.'
  }
  return bruta
}

/** Sufixo curto pro slug nunca colidir entre dois carros iguais. */
function sufixo(): string {
  return Math.random().toString(36).slice(2, 6)
}

function limpaCache(slug?: string) {
  revalidatePath('/')
  revalidatePath('/veiculos')
  if (slug) revalidatePath(`/veiculos/${slug}`)
  revalidatePath('/painel/veiculos')
}

export async function salvarVeiculo(
  _estado: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  const sessao = await exigirEquipe()
  const sb = await criarClienteServidor()

  const parsed = lerFormulario(fd)
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? 'Confira os campos do formulário.' }
  }
  const d = parsed.data
  const id = texto(fd.get('id')) || null

  const { custo_centavos, minimo_centavos, ...campos } = d

  // Piso de venda acima do preço de tabela nao faz sentido e viraria desconto
  // negativo na tela do vendedor.
  if (minimo_centavos !== null && minimo_centavos > campos.preco_centavos) {
    return { erro: 'O preço mínimo não pode ser maior que o preço de venda.' }
  }

  let slug: string
  let veiculoId: string

  if (id) {
    const { data, error } = await sb
      .from('veiculos')
      .update(campos)
      .eq('id', id)
      .select('id, slug')
      .single()
    if (error) return { erro: `Não foi possível salvar: ${mensagemDoBanco(error.message)}` }
    veiculoId = data.id
    slug = data.slug
  } else {
    slug = gerarSlug([d.marca, d.modelo, d.versao, d.ano_modelo], sufixo())
    const { data, error } = await sb
      .from('veiculos')
      .insert({ ...campos, slug, criado_por: sessao.userId })
      .select('id, slug')
      .single()
    if (error) return { erro: `Não foi possível cadastrar: ${mensagemDoBanco(error.message)}` }
    veiculoId = data.id
  }

  // Margem vive em tabela separada, que o site publico nao enxerga.
  if (custo_centavos !== null || minimo_centavos !== null) {
    await sb.from('veiculo_financeiro').upsert(
      {
        veiculo_id: veiculoId,
        custo_centavos,
        minimo_centavos,
        atualizado_por: sessao.userId,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: 'veiculo_id' },
    )
  }

  const falha = await registrarFotos(veiculoId, texto(fd.get('fotos_caminhos')))
  if (falha) return { erro: falha }

  limpaCache(slug)
  redirect(`/painel/veiculos/${veiculoId}?salvo=1`)
}

/**
 * Registra no banco as fotos que o navegador ja enviou pro Storage.
 *
 * O upload em si acontece no cliente (ver src/components/painel/SeletorFotos):
 * a foto e reduzida no proprio celular e vai direto pro bucket, sem passar por
 * aqui. Server Action do Next aceita 1 MB por envio e a Vercel corta em 4,5 MB,
 * entao mandar 12 fotos por esta funcao simplesmente nao caberia.
 *
 * O que chega aqui e so a lista de caminhos, na ordem que a pessoa escolheu.
 * Como essa lista vem do navegador, ela e conferida antes de virar registro:
 *   - formato do caminho tem que bater exatamente com o que o seletor gera
 *   - o arquivo tem que existir mesmo no bucket
 * Sem isso, daria pra mandar um caminho inventado e apontar o carro pra
 * qualquer objeto do bucket.
 */
const CAMINHO_VALIDO = /^lote\/[0-9a-f-]{36}\/\d{10,}-[a-z0-9]{4,10}\.webp$/

async function registrarFotos(veiculoId: string, cru: string): Promise<string | null> {
  if (!cru) return null

  let caminhos: unknown
  try {
    caminhos = JSON.parse(cru)
  } catch {
    return 'Não consegui ler a lista de fotos. Tente escolher de novo.'
  }
  if (!Array.isArray(caminhos) || caminhos.length === 0) return null

  const validos = caminhos
    .filter((c): c is string => typeof c === 'string' && CAMINHO_VALIDO.test(c))
    .slice(0, 30)

  if (validos.length !== caminhos.length) {
    return 'Alguma foto veio com caminho inválido. Tente escolher de novo.'
  }

  const sb = await criarClienteServidor()

  const { data: existentes } = await sb
    .from('veiculo_fotos')
    .select('ordem')
    .eq('veiculo_id', veiculoId)
    .order('ordem', { ascending: false })
    .limit(1)

  let ordem = (existentes?.[0]?.ordem ?? -1) + 1

  for (const caminho of validos) {
    const pasta = caminho.slice(0, caminho.lastIndexOf('/'))
    const arquivo = caminho.slice(caminho.lastIndexOf('/') + 1)

    // O arquivo existe mesmo? Caminho sem objeto vira card quebrado no site.
    const { data: achados } = await sb.storage.from('veiculos').list(pasta, {
      search: arquivo,
      limit: 1,
    })
    if (!achados?.length) {
      return 'Uma das fotos não chegou ao servidor. Tente enviar de novo.'
    }

    await sb.from('veiculo_fotos').insert({
      veiculo_id: veiculoId,
      path: caminho,
      ordem,
      alt: '',
    })
    ordem++
  }

  return null
}

export async function apagarFoto(formData: FormData) {
  await exigirEquipe()
  const sb = await criarClienteServidor()

  const fotoId = texto(formData.get('fotoId'))
  const veiculoId = texto(formData.get('veiculoId'))
  if (!fotoId || !veiculoId) return

  const { data: foto } = await sb
    .from('veiculo_fotos')
    .select('path')
    .eq('id', fotoId)
    .maybeSingle()

  if (foto?.path) {
    await sb.storage.from('veiculos').remove([foto.path])
  }
  await sb.from('veiculo_fotos').delete().eq('id', fotoId)

  limpaCache()
  revalidatePath(`/painel/veiculos/${veiculoId}`)
}

export async function definirCapa(formData: FormData) {
  await exigirEquipe()
  const sb = await criarClienteServidor()

  const fotoId = texto(formData.get('fotoId'))
  const veiculoId = texto(formData.get('veiculoId'))
  if (!fotoId || !veiculoId) return

  const { data: fotos } = await sb
    .from('veiculo_fotos')
    .select('id, ordem')
    .eq('veiculo_id', veiculoId)
    .order('ordem')

  if (!fotos) return

  // A capa vai pra ordem 0 e o resto desce mantendo a sequencia.
  const resto = fotos.filter((f) => f.id !== fotoId)
  await sb.from('veiculo_fotos').update({ ordem: 0 }).eq('id', fotoId)
  await Promise.all(
    resto.map((f, i) => sb.from('veiculo_fotos').update({ ordem: i + 1 }).eq('id', f.id)),
  )

  limpaCache()
  revalidatePath(`/painel/veiculos/${veiculoId}`)
}

/** Arquiva em vez de apagar: erro humano nao pode virar perda de dado. */
export async function arquivarVeiculo(formData: FormData) {
  await exigirEquipe()
  const sb = await criarClienteServidor()

  const id = texto(formData.get('id'))
  if (!id) return

  await sb.from('veiculos').update({ status: 'arquivado' }).eq('id', id)
  limpaCache()
  redirect('/painel/veiculos?arquivado=1')
}

/**
 * Liga e desliga o destaque direto da lista do estoque, sem abrir o carro.
 *
 * Le o valor atual no banco em vez de receber o novo do formulario: assim dois
 * cliques rapidos no mesmo cartao nao gravam o mesmo valor duas vezes, e um
 * formulario forjado nao consegue ligar destaque num carro que nao devia.
 *
 * O limite de 8 e do banco (trigger `veiculos_limita_destaques`), nao daqui.
 * Contar antes de gravar seria uma checagem que duas pessoas clicando ao mesmo
 * tempo furariam.
 */
export async function alternarDestaque(formData: FormData) {
  await exigirEquipe()
  const sb = await criarClienteServidor()

  const id = texto(formData.get('id'))
  if (!id) return

  const { data: atual } = await sb
    .from('veiculos')
    .select('destaque, status')
    .eq('id', id)
    .single()
  if (!atual) return

  // Carro fora do ar nao tem o que destacar: o trigger zeraria de novo e o
  // clique pareceria não ter feito nada.
  if (atual.status !== 'publicado' && !atual.destaque) {
    redirect('/painel/veiculos?destaque=fora-do-ar')
  }

  const { error } = await sb
    .from('veiculos')
    .update({ destaque: !atual.destaque })
    .eq('id', id)

  if (error) {
    if (error.message.includes('limite_destaques')) {
      redirect('/painel/veiculos?destaque=cheio')
    }
    redirect('/painel/veiculos?destaque=erro')
  }

  limpaCache()
  revalidatePath('/painel')
}

export async function mudarStatus(formData: FormData) {
  await exigirEquipe()
  const sb = await criarClienteServidor()

  const id = texto(formData.get('id'))
  const status = texto(formData.get('status'))
  if (!id || !STATUS.includes(status as (typeof STATUS)[number])) return

  await sb.from('veiculos').update({ status }).eq('id', id)
  limpaCache()
}

export async function sair() {
  const sb = await criarClienteServidor()
  await sb.auth.signOut()
  redirect('/entrar')
}

const CAMINHO_BANNER = /^banner\/\d{10,}-[a-z0-9]{4,10}\.webp$/

/**
 * Salva o banner do topo do catalogo.
 *
 * Como o caminho da imagem vem do navegador, ele e conferido contra o formato
 * que o formulario gera antes de virar registro, igual as fotos de veiculo.
 */
export async function salvarBanner(
  _estado: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  await exigirEquipe()
  const sb = await criarClienteServidor()

  const id = texto(fd.get('id')) || null
  const titulo = texto(fd.get('titulo')).slice(0, 120)
  const ativo = fd.get('ativo') === 'on'
  const caminho = texto(fd.get('imagem_path'))

  if (caminho && !CAMINHO_BANNER.test(caminho)) {
    return { erro: 'A imagem veio com caminho inválido. Tente enviar de novo.' }
  }

  if (!id && !caminho) {
    return { erro: 'Escolha uma imagem para o banner.' }
  }

  if (id) {
    const mudancas: Record<string, unknown> = { titulo, ativo }
    if (caminho) mudancas.imagem_path = caminho
    const { error } = await sb.from('banners').update(mudancas).eq('id', id)
    if (error) return { erro: `Não foi possível salvar: ${error.message}` }
  } else {
    const { error } = await sb
      .from('banners')
      .insert({ titulo, ativo, imagem_path: caminho, ordem: 0 })
    if (error) return { erro: `Não foi possível salvar: ${error.message}` }
  }

  revalidatePath('/veiculos')
  revalidatePath('/painel/banner')
  redirect('/painel/banner?salvo=1')
}

/*
 * Fotos de cliente (carrossel "Quem ja e da Ultra")
 *
 * O arquivo sobe do navegador direto pro bucket `clientes`, pelo mesmo motivo
 * das fotos de veiculo (limite de corpo da Server Action e da Vercel). Aqui so
 * chegam caminhos e ids.
 *
 * Toda acao revalida a home: ela e ISR de 5 minutos, e sem isto o Pietro mexe,
 * abre o site e acha que nao funcionou.
 */

function atualizaFotosClientes() {
  revalidatePath('/')
  revalidatePath('/painel/clientes')
}

// So aceita o formato que o proprio painel gera. Impede que alguem com sessao
// aponte a linha pra arquivo de outro bucket ou pra fora da pasta.
const EsquemaCaminhosCliente = z
  .array(z.string().regex(/^painel\/[\w-]+\.webp$/))
  .min(1)
  .max(30)

export async function adicionarFotosClientes(
  caminhos: string[],
): Promise<{ erro?: string }> {
  await exigirEquipe()
  const sb = await criarClienteServidor()

  const validos = EsquemaCaminhosCliente.safeParse(caminhos)
  if (!validos.success) return { erro: 'Envio inválido. Escolha as fotos de novo.' }

  // Foto nova entra no fim da fila. Quem quiser ela na frente, move.
  const { data: ultima } = await sb
    .from('fotos_clientes')
    .select('ordem')
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle()
  const base = (ultima?.ordem ?? 0) + 1

  const { error } = await sb
    .from('fotos_clientes')
    .insert(validos.data.map((path, i) => ({ path, ordem: base + i })))

  if (error) {
    // Sem linha no banco o arquivo nao aparece em lugar nenhum: apaga pra nao
    // ficar lixo ocupando o bucket.
    await sb.storage.from('clientes').remove(validos.data)
    return { erro: `Não foi possível salvar: ${error.message}` }
  }

  atualizaFotosClientes()
  return {}
}

/**
 * Liga e desliga o espelho. O arquivo nunca e tocado: o site aplica
 * scaleX(-1) na hora de mostrar, entao desfazer devolve a foto original.
 */
export async function alternarEspelhoCliente(formData: FormData) {
  await exigirEquipe()
  const sb = await criarClienteServidor()

  const id = texto(formData.get('id'))
  if (!id) return

  const { data: atual } = await sb
    .from('fotos_clientes')
    .select('espelhada')
    .eq('id', id)
    .single()
  if (!atual) return

  const { error } = await sb
    .from('fotos_clientes')
    .update({ espelhada: !atual.espelhada })
    .eq('id', id)
  if (error) redirect('/painel/clientes?erro=1')

  atualizaFotosClientes()
}

/**
 * Troca a foto de lugar com a vizinha. Duas escritas e nao uma transacao:
 * se a segunda falhar, as duas ficam com a mesma ordem e o desempate por data
 * mantem a lista estavel. O proximo clique corrige.
 */
export async function moverFotoCliente(formData: FormData) {
  await exigirEquipe()
  const sb = await criarClienteServidor()

  const id = texto(formData.get('id'))
  const direcao = texto(formData.get('direcao'))
  if (!id || (direcao !== 'antes' && direcao !== 'depois')) return

  const { data: lista } = await sb
    .from('fotos_clientes')
    .select('id, ordem')
    .order('ordem')
    .order('criado_em')
  if (!lista) return

  const i = lista.findIndex((f) => f.id === id)
  const j = direcao === 'antes' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= lista.length) return

  // Usa a posicao na lista e nao a ordem gravada: se duas fotos tiverem a
  // mesma ordem, trocar os valores nao mudaria nada na tela.
  const { error: e1 } = await sb.from('fotos_clientes').update({ ordem: j }).eq('id', lista[i].id)
  const { error: e2 } = await sb.from('fotos_clientes').update({ ordem: i }).eq('id', lista[j].id)
  if (e1 || e2) redirect('/painel/clientes?erro=1')

  atualizaFotosClientes()
}

export async function removerFotoCliente(formData: FormData) {
  await exigirEquipe()
  const sb = await criarClienteServidor()

  const id = texto(formData.get('id'))
  if (!id) return

  const { data: foto } = await sb
    .from('fotos_clientes')
    .select('path')
    .eq('id', id)
    .single()
  if (!foto) return

  // Primeiro a linha, depois o arquivo: se o Storage falhar, a foto ja saiu do
  // site, que e o que o Pietro pediu. Arquivo orfao e so espaco.
  const { error } = await sb.from('fotos_clientes').delete().eq('id', id)
  if (error) redirect('/painel/clientes?erro=1')

  await sb.storage.from('clientes').remove([foto.path])

  atualizaFotosClientes()
}
