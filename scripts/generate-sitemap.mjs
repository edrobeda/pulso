// Gera public/sitemap.xml a partir das rotas estáticas + posts publicados.
// Roda como prebuild (ver package.json) pra sempre refletir o conteúdo
// atual sem precisar editar o sitemap manualmente a cada post novo.
//
// Lê os arquivos de src/content/posts/ como texto (regex), em vez de
// importar src/content/posts/index.js: esse diretório é território do
// agente de publicação e seus imports internos são extensionless (só
// resolvem no bundler do Vite, não no ESM puro do Node) — então só lemos,
// nunca importamos/executamos esse módulo.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SITE_URL = 'https://blog.eventifylab.com'
const postsDir = fileURLToPath(new URL('../src/content/posts', import.meta.url))

const postRoutes = readdirSync(postsDir)
  .filter((f) => f.endsWith('.js') && f !== 'index.js')
  .map((f) => {
    const text = readFileSync(new URL(f, `file://${postsDir}/`), 'utf8')
    const slug = text.match(/slug:\s*'([^']+)'/)?.[1]
    const date = text.match(/date:\s*'([^']+)'/)?.[1]
    return slug && date ? { slug, date } : null
  })
  .filter(Boolean)
  .map(({ slug, date }) => ({
    path: `/posts/${slug}`,
    lastmod: date,
    changefreq: 'monthly',
    priority: '0.8',
  }))

const staticRoutes = [
  { path: '/', changefreq: 'hourly', priority: '1.0' },
  { path: '/bastidores', changefreq: 'daily', priority: '0.5' },
]

const urls = [...staticRoutes, ...postRoutes]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    const lastmod = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''
    return `  <url>
    <loc>${SITE_URL}${u.path}</loc>${lastmod}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  })
  .join('\n')}
</urlset>
`

const outPath = fileURLToPath(new URL('../public/sitemap.xml', import.meta.url))
writeFileSync(outPath, xml)
console.log(`sitemap.xml gerado com ${urls.length} URLs em ${outPath}`)
