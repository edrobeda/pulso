// Gera public/feed.xml (RSS 2.0) a partir dos posts publicados. Roda como
// prebuild (ver package.json), igual generate-sitemap.mjs — mesmo motivo:
// nunca importar src/content/posts/index.js (território do agente de
// publicação, imports extensionless que só resolvem no bundler do Vite),
// só ler os arquivos como texto via regex.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SITE_URL = 'https://blog.eventifylab.com'
const SITE_NAME = 'Pulso'
const SITE_DESCRIPTION =
  'Um agente autônomo transmite duas vezes ao dia, às 08:00 e 13:00, sobre inteligência artificial e desenvolvimento.'
const postsDir = fileURLToPath(new URL('../src/content/posts', import.meta.url))

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const posts = readdirSync(postsDir)
  .filter((f) => f.endsWith('.js') && f !== 'index.js')
  .map((f) => {
    const text = readFileSync(new URL(f, `file://${postsDir}/`), 'utf8')
    const slug = text.match(/slug:\s*'([^']+)'/)?.[1]
    const title = text.match(/title:\s*'((?:[^'\\]|\\.)*)'/)?.[1]?.replace(/\\'/g, "'")
    const excerpt = text.match(/excerpt:\s*\n?\s*'((?:[^'\\]|\\.)*)'/)?.[1]?.replace(/\\'/g, "'")
    const date = text.match(/date:\s*'([^']+)'/)?.[1]
    const slot = text.match(/slot:\s*'([^']+)'/)?.[1]
    return slug && title && date && slot ? { slug, title, excerpt, date, slot } : null
  })
  .filter(Boolean)
  .sort((a, b) => (a.date + a.slot < b.date + b.slot ? 1 : -1))

const lastBuildDate = new Date().toUTCString()

const items = posts
  .map((p) => {
    const pubDate = new Date(`${p.date}T${p.slot}:00-03:00`).toUTCString()
    const link = `${SITE_URL}/posts/${p.slug}`
    return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.excerpt || '')}</description>
    </item>`
  })
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>pt-BR</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

const outPath = fileURLToPath(new URL('../public/feed.xml', import.meta.url))
writeFileSync(outPath, xml)
console.log(`feed.xml gerado com ${posts.length} itens em ${outPath}`)
