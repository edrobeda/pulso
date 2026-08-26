# Smoke test pós-deploy com browser headless

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de um caso real para uso genérico. Não
> foi testado no seu ambiente. Leia, entenda e adapte antes de usar. O autor
> não se responsabiliza por qualquer dano, perda de dados, indisponibilidade
> ou mau funcionamento decorrente do uso deste conteúdo — a responsabilidade
> de validar é sempre de quem executa.

## O problema que isso resolve

Um deploy que responde `HTTP 200` não é a mesma coisa que um deploy que
**funciona**. Um erro de JavaScript na carga do módulo (uma variável de
template não escapada, uma referência indefinida) ainda devolve o HTML/CSS
inteiro com status 200 — o navegador só descobre o problema ao *executar* o
script. Se várias páginas compartilham o mesmo bundle, um erro numa rota
nova pode derrubar o site inteiro em tela branca, e um `curl` de validação
não vê nada de errado.

## O que fazer

Depois de qualquer deploy automatizado (por um agente ou por CI), abra a
página de verdade num browser headless e cheque se algum erro de console ou
`pageerror` foi disparado — não só o status HTTP.

## Script de exemplo (Node + Puppeteer)

```js
// smoke-test.mjs
// Uso: node smoke-test.mjs https://seu-dominio.exemplo/ /rota-1 /rota-2
import puppeteer from 'puppeteer'

const baseUrl = process.argv[2]
const routes = process.argv.slice(3)
if (!baseUrl || routes.length === 0) {
  console.error('uso: node smoke-test.mjs <base-url> <rota-1> [rota-2 ...]')
  process.exit(2)
}

const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
let failed = false

for (const route of routes) {
  const page = await browser.newPage()
  const errors = []

  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`)
  })

  const url = new URL(route, baseUrl).toString()
  const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 })

  if (!response || !response.ok()) {
    errors.push(`http status ${response ? response.status() : 'sem resposta'}`)
  }

  if (errors.length > 0) {
    failed = true
    console.error(`✗ ${url}`)
    errors.forEach((e) => console.error(`  ${e}`))
  } else {
    console.log(`✓ ${url}`)
  }

  await page.close()
}

await browser.close()
process.exit(failed ? 1 : 0)
```

## Como plugar num script de deploy

Rode isso como último passo, **depois** do container subir e **antes** de
considerar a rodada um sucesso (commit, notificação de "ok" etc.):

```bash
node smoke-test.mjs "https://seu-dominio.exemplo" "/" "/rota-nova" || {
  echo "smoke test falhou, revertendo/alertando"
  exit 1
}
```

## Lição por trás disso

`curl` valida transporte (o servidor respondeu). Só um browser real valida
execução (o JavaScript rodou sem quebrar). Se seu processo de deploy é
autônomo (agente ou CI sem revisão humana), a diferença entre os dois é a
diferença entre "publicou" e "publicou um site quebrado sem ninguém notar".
