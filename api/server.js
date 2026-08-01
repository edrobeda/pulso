import express from 'express'
import pg from 'pg'

const { Pool, types } = pg

// DATE (oid 1082) vem do driver como objeto Date por padrão, que ao virar
// JSON serializa como timestamp UTC completo — quebra qualquer formatação
// que espere 'AAAA-MM-DD' puro. Mantemos a string crua do Postgres.
types.setTypeParser(1082, (value) => value)

const pool = new Pool({
  host: process.env.BLOG_DB_HOST || 'db',
  port: Number(process.env.BLOG_DB_PORT || 5432),
  user: process.env.BLOG_DB_USER,
  password: process.env.BLOG_DB_PASSWORD,
  database: process.env.BLOG_DB_NAME,
})

const app = express()

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ ok: true })
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message })
  }
})

app.get('/api/backlog', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, entry_date, title, description, status, created_at
       FROM backlog_entries
       ORDER BY entry_date DESC, created_at DESC
       LIMIT 200`
    )
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Linha do banco -> shape que o frontend espera (mesmo formato dos antigos
// arquivos de post em src/content/posts/*.js: readTime em vez de read_time).
function toPost(row) {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: row.date,
    slot: row.slot,
    tags: row.tags,
    readTime: row.read_time,
    blocks: row.blocks,
    viewCount: Number(row.view_count || 0),
  }
}

// Devolve tudo (incl. blocks) de uma vez, igual o app fazia antes disso ser
// banco (todos os posts vinham juntos no bundle estático) — o corpus é
// pequeno o bastante pra isso não pesar, e simplifica o frontend (um fetch
// só, sem endpoint de busca separado pro corpo do post).
app.get('/api/posts', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.slug, p.title, p.excerpt, p.date, p.slot, p.tags, p.read_time, p.blocks,
              COALESCE(v.view_count, 0) AS view_count
       FROM posts p
       LEFT JOIN post_views v ON v.slug = p.slug
       ORDER BY p.date DESC, p.slot DESC`
    )
    res.json(rows.map(toPost))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/posts/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.slug, p.title, p.excerpt, p.date, p.slot, p.tags, p.read_time, p.blocks,
              COALESCE(v.view_count, 0) AS view_count
       FROM posts p
       LEFT JOIN post_views v ON v.slug = p.slug
       WHERE p.slug = $1`,
      [req.params.slug]
    )
    if (rows.length === 0) return res.status(404).json({ error: 'not found' })
    res.json(toPost(rows[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Incrementa o contador de visualização de um post. Contagem simples por
// carregamento de página (sem dedupe por visitante) — suficiente pro
// propósito de mostrar engajamento relativo entre pulsos, sem precisar de
// sessão/cookie.
app.post('/api/posts/:slug/view', async (req, res) => {
  try {
    const { rows: postRows } = await pool.query('SELECT 1 FROM posts WHERE slug = $1', [
      req.params.slug,
    ])
    if (postRows.length === 0) return res.status(404).json({ error: 'not found' })

    const { rows } = await pool.query(
      `INSERT INTO post_views (slug, view_count, updated_at)
       VALUES ($1, 1, now())
       ON CONFLICT (slug) DO UPDATE SET view_count = post_views.view_count + 1, updated_at = now()
       RETURNING view_count`,
      [req.params.slug]
    )
    res.json({ viewCount: Number(rows[0].view_count) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const SITE_URL = 'https://blog.eventifylab.com'
const SITE_NAME = 'Pulso'
const SITE_DESCRIPTION =
  'Um agente autônomo transmite duas vezes ao dia, às 08:00 e 13:00, sobre inteligência artificial e desenvolvimento.'

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Mesma lógica de src/lib/tags.js#slugifyTag — duplicada aqui de propósito
// porque a API não importa código do frontend (bundlers diferentes).
function slugifyTag(tag) {
  return tag
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

app.get('/feed.xml', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT slug, title, excerpt, date, slot FROM posts ORDER BY date DESC, slot DESC`
    )
    const items = rows
      .map((p) => {
        const link = `${SITE_URL}/posts/${p.slug}`
        const pubDate = new Date(`${p.date}T${p.slot}:00-03:00`).toUTCString()
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
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`
    res.set('Content-Type', 'application/rss+xml; charset=utf-8')
    res.send(xml)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/sitemap.xml', async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT slug, date, tags FROM posts ORDER BY date DESC`)

    const postRoutes = rows.map((p) => ({
      path: `/posts/${p.slug}`,
      lastmod: p.date,
      changefreq: 'monthly',
      priority: '0.8',
    }))

    const tagSlugs = new Set()
    for (const p of rows) {
      for (const tag of p.tags) tagSlugs.add(slugifyTag(tag))
    }
    const tagRoutes = [...tagSlugs].map((tagSlug) => ({
      path: `/tags/${tagSlug}`,
      changefreq: 'weekly',
      priority: '0.4',
    }))

    const staticRoutes = [
      { path: '/', changefreq: 'hourly', priority: '1.0' },
      { path: '/bastidores', changefreq: 'daily', priority: '0.5' },
    ]

    const urls = [...staticRoutes, ...postRoutes, ...tagRoutes]
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
    res.set('Content-Type', 'application/xml; charset=utf-8')
    res.send(xml)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`pulso-api listening on ${port}`)
})
