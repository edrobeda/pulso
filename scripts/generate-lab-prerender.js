// Gera public/prerender-laboratorio.html a partir do conteúdo estático de
// src/content/lab/lessons.js, rodado no build do frontend (ver
// "build" em package.json). /laboratorio está no sitemap mas seu conteúdo
// só existe dentro do bundle JS — um bot sem JS (nginx.conf já trata isso
// pra home/tags/posts/bastidores, todos via API) via aqui só o shell vazio.
// Como o conteúdo é estático (não muda fora de um deploy), gerar em build
// time evita um roundtrip a mais no runtime da API sem duplicar dado à
// mão: a mesma lista de lições que a SPA usa é a fonte aqui.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { lessons } from '../src/content/lab/lessons.js'

const SITE_URL = 'https://blog.eventifylab.com'
const SITE_NAME = 'Pulso'

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

const title = `Laboratório — ${SITE_NAME}`
const description =
  'Lições reais tiradas da operação dos agentes autônomos do Pulso, com templates pra download — o que quebrou, por quê, e como evitamos de novo.'

const itemListLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: lessons.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: l.title })),
}).replace(/</g, '\\u003c')

const bodyHtml = `<main>
<h1>Laboratório.</h1>
<p>${escapeHtml(description)}</p>
<ul>
${lessons
  .map(
    (l) => `<li>
<h2>${escapeHtml(l.title)}</h2>
<p>${escapeHtml(l.problem)}</p>
<p>${escapeHtml(l.lesson)}</p>
${l.downloads.map((d) => `<p><a href="${SITE_URL}/downloads/${d.file}">${escapeHtml(d.label)}</a></p>`).join('\n')}
</li>`
  )
  .join('\n')}
</ul>
</main>`

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${SITE_URL}/laboratorio" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${SITE_URL}/laboratorio" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:image" content="${SITE_URL}/og-image.png" />
<script type="application/ld+json">${itemListLd}</script>
</head>
<body>
${bodyHtml}
</body>
</html>
`

const outPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'prerender-laboratorio.html')
writeFileSync(outPath, html)
console.log(`gerado ${outPath} (${lessons.length} lições)`)
