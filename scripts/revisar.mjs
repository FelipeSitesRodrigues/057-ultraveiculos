/**
 * Revisao visual e tecnica das paginas.
 *
 * Usa o Edge instalado na maquina via puppeteer-core, entao emula viewport de
 * verdade. Isso importa: o Edge em modo headless simples nao respeita largura
 * abaixo de ~500px no Windows, e o print de celular sai renderizado mais largo
 * e recortado, o que engana na revisao.
 *
 * O que ele checa em cada pagina e viewport:
 *   1. overflow horizontal (o bug de mobile mais comum, e o mais invisivel)
 *   2. erro de console e requisicao que falhou
 *   3. imagem sem alt
 *   4. vazamento de dado financeiro no HTML entregue
 *
 * Uso:
 *   node scripts/revisar.mjs
 *   node scripts/revisar.mjs /veiculos /financiamento
 */
import puppeteer from 'puppeteer-core'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const SAIDA = process.env.SAIDA ?? '../revisao'

const CAMINHOS_EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]

const VIEWPORTS = [
  { nome: 'mobile', width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
  { nome: 'tablet', width: 768, height: 1024, deviceScaleFactor: 1 },
  { nome: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
  // Tela larga e baixa: onde hero com imagem costuma cortar feio.
  { nome: 'largo-baixo', width: 1920, height: 720, deviceScaleFactor: 1 },
]

// Palavras que NUNCA podem aparecer no HTML entregue ao visitante.
const PROIBIDO = ['custo_centavos', 'minimo_centavos', 'service_role', 'SUPABASE_SERVICE']

const rotas = process.argv.slice(2).length ? process.argv.slice(2) : ['/']

const executablePath = CAMINHOS_EDGE.find((p) => existsSync(p))
if (!executablePath) {
  console.error('Edge nao encontrado. Ajuste CAMINHOS_EDGE em scripts/revisar.mjs')
  process.exit(1)
}

await mkdir(SAIDA, { recursive: true })

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: ['--disable-gpu', '--hide-scrollbars', '--force-prefers-reduced-motion'],
})

let problemas = 0

for (const rota of rotas) {
  const nomeRota = rota === '/' ? 'home' : rota.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
  console.log(`\n${'='.repeat(60)}\n${rota}\n${'='.repeat(60)}`)

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage()
    const erros = []
    const falhas = []

    page.on('console', (m) => {
      if (m.type() === 'error') erros.push(m.text().slice(0, 200))
    })
    page.on('pageerror', (e) => erros.push(`pageerror: ${e.message.slice(0, 200)}`))
    page.on('requestfailed', (r) => {
      // net::ERR_ABORTED em prefetch do Next e ruido conhecido
      if (!r.failure()?.errorText.includes('ERR_ABORTED')) {
        falhas.push(`${r.url().slice(0, 90)} (${r.failure()?.errorText})`)
      }
    })

    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.deviceScaleFactor ?? 1,
      isMobile: vp.isMobile ?? false,
      hasTouch: vp.isMobile ?? false,
    })

    await page.goto(BASE + rota, { waitUntil: 'networkidle2', timeout: 60000 })
    // Deixa a fonte assentar antes de medir, senao o texto mede errado.
    await page.evaluate(() => document.fonts.ready)

    const relatorio = await page.evaluate(() => {
      const doc = document.documentElement
      const larguraJanela = window.innerWidth
      const estourando = []

      if (doc.scrollWidth > larguraJanela + 1) {
        // Acha quem esta empurrando, pra nao ficar caçando no escuro.
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (r.right > larguraJanela + 1 || r.left < -1) {
            const est = getComputedStyle(el)
            if (est.position === 'fixed') continue
            estourando.push({
              tag: el.tagName.toLowerCase(),
              classe: (el.className?.toString?.() ?? '').slice(0, 90),
              direita: Math.round(r.right),
              esquerda: Math.round(r.left),
            })
          }
        }
      }

      const semAlt = [...document.querySelectorAll('img')]
        .filter((i) => i.alt === null || i.alt === undefined)
        .map((i) => i.currentSrc?.slice(-60))

      return {
        scrollWidth: doc.scrollWidth,
        larguraJanela,
        // so os 5 primeiros, os de fora costumam ser filhos do mesmo culpado
        estourando: estourando.slice(0, 5),
        totalEstourando: estourando.length,
        semAlt,
        titulo: document.title,
      }
    })

    const html = await page.content()
    const vazamentos = PROIBIDO.filter((p) => html.includes(p))

    const arquivo = `${SAIDA}/${nomeRota}-${vp.nome}.png`
    await page.screenshot({ path: arquivo, fullPage: vp.nome !== 'largo-baixo' })

    const linhas = []
    if (relatorio.totalEstourando > 0) {
      linhas.push(
        `  ESTOURA  largura da pagina ${relatorio.scrollWidth}px numa janela de ${relatorio.larguraJanela}px`,
      )
      for (const e of relatorio.estourando) {
        linhas.push(`           <${e.tag}> vai ate ${e.direita}px  class="${e.classe}"`)
      }
      if (relatorio.totalEstourando > 5) {
        linhas.push(`           e mais ${relatorio.totalEstourando - 5} elemento(s)`)
      }
      problemas++
    }
    if (erros.length) {
      linhas.push(`  ERRO     console: ${erros.slice(0, 3).join(' | ')}`)
      problemas++
    }
    if (falhas.length) {
      linhas.push(`  ERRO     requisicao falhou: ${falhas.slice(0, 3).join(' | ')}`)
      problemas++
    }
    if (relatorio.semAlt.length) {
      linhas.push(`  ACESSO   ${relatorio.semAlt.length} imagem(ns) sem alt`)
      problemas++
    }
    if (vazamentos.length) {
      linhas.push(`  VAZOU    o HTML contem: ${vazamentos.join(', ')}`)
      problemas++
    }

    console.log(
      `${vp.nome.padEnd(12)} ${String(vp.width).padStart(4)}px  ${
        linhas.length ? '' : 'ok'
      }`,
    )
    linhas.forEach((l) => console.log(l))

    await page.close()
  }
}

await browser.close()

console.log(`\n${'='.repeat(60)}`)
if (problemas === 0) {
  console.log('Nenhum problema encontrado.')
} else {
  console.log(`${problemas} problema(s) encontrado(s).`)
  process.exitCode = 1
}
