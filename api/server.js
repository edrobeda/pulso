import express from 'express'
import pg from 'pg'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

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

// API não serve HTML nem carrega asset de terceiro (CSP restritiva não se
// aplica); mantém os outros cabeçalhos padrão do helmet (nosniff, no
// referrer, sem framing, etc.) como camada básica de hardening.
app.use(helmet({ contentSecurityPolicy: false }))
app.use(express.json())

// Só os endpoints de escrita (incrementar view/reação) levam limite — são
// os únicos que um script poderia martelar pra inflar número; leitura fica
// livre porque cache de CDN/browser já amortece.
const writeLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
})

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
    res.set('Cache-Control', 'public, max-age=60')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Transparência de custo/trabalho real por rodada dos dois agentes
// autônomos (pedido do Edson, ver NECESSIDADES.md 2026-08-01).
app.get('/api/usage', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT agent, run_at, input_tokens, output_tokens, cache_read_tokens,
              cache_creation_tokens, cost_usd, duration_ms
       FROM round_usage
       ORDER BY run_at DESC
       LIMIT 30`
    )
    res.set('Cache-Control', 'public, max-age=60')
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
    res.set('Cache-Control', 'public, max-age=60')
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
    res.set('Cache-Control', 'public, max-age=60')
    res.json(toPost(rows[0]))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Incrementa o contador de visualização de um post. Contagem simples por
// carregamento de página (sem dedupe por visitante) — suficiente pro
// propósito de mostrar engajamento relativo entre pulsos, sem precisar de
// sessão/cookie.
app.post('/api/posts/:slug/view', writeLimiter, async (req, res) => {
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

// Reações rápidas por post — emoji fixo (whitelist), sem texto livre, pra
// não precisar de moderação de spam. Contagem simples, sem dedupe
// servidor-a-servidor por visitante (o frontend guarda em localStorage pra
// não deixar clicar duas vezes no mesmo emoji no mesmo navegador).
const REACTION_EMOJIS = ['👍', '💡', '🔥', '❤️']

app.get('/api/posts/:slug/reactions', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT emoji, count FROM post_reactions WHERE slug = $1',
      [req.params.slug]
    )
    const counts = Object.fromEntries(REACTION_EMOJIS.map((e) => [e, 0]))
    for (const row of rows) {
      if (row.emoji in counts) counts[row.emoji] = Number(row.count)
    }
    res.set('Cache-Control', 'public, max-age=30')
    res.json(counts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/posts/:slug/reactions', writeLimiter, async (req, res) => {
  try {
    const emoji = req.body?.emoji
    if (!REACTION_EMOJIS.includes(emoji)) {
      return res.status(400).json({ error: 'emoji inválido' })
    }
    const { rows: postRows } = await pool.query('SELECT 1 FROM posts WHERE slug = $1', [
      req.params.slug,
    ])
    if (postRows.length === 0) return res.status(404).json({ error: 'not found' })

    const { rows } = await pool.query(
      `INSERT INTO post_reactions (slug, emoji, count, updated_at)
       VALUES ($1, $2, 1, now())
       ON CONFLICT (slug, emoji) DO UPDATE SET count = post_reactions.count + 1, updated_at = now()
       RETURNING count`,
      [req.params.slug, emoji]
    )
    res.json({ emoji, count: Number(rows[0].count) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Comentários por post — moderação heurística antes de ir ao ar (sem link
// na mensagem, tamanho limitado, honeypot, mesmo writeLimiter das reações)
// em vez de fila manual, seguindo a mesma filosofia do resto do blog.
// `visible` deixa uma válvula de escape pra esconder via psql um
// comentário problemático que passe pela heurística, sem apagar a linha.
const COMMENT_MIN_LEN = 2
const COMMENT_MAX_LEN = 1000
const COMMENT_BLOCK_PATTERN = /https?:\/\/|www\.|\b(viagra|cialis|casino|apostas?|empr[eé]stimo|bit\.ly)\b/i

app.get('/api/posts/:slug/comments', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, author_name, body, created_at
       FROM post_comments
       WHERE slug = $1 AND visible = true
       ORDER BY created_at ASC
       LIMIT 200`,
      [req.params.slug]
    )
    res.set('Cache-Control', 'public, max-age=30')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/posts/:slug/comments', writeLimiter, async (req, res) => {
  try {
    // Honeypot: campo escondido no form que só um bot preencheria.
    if (req.body?.website) return res.status(400).json({ error: 'invalid' })

    const body = String(req.body?.body || '').trim()
    if (body.length < COMMENT_MIN_LEN || body.length > COMMENT_MAX_LEN) {
      return res.status(400).json({ error: 'comentário precisa ter entre 2 e 1000 caracteres' })
    }
    if (COMMENT_BLOCK_PATTERN.test(body)) {
      return res.status(400).json({ error: 'comentário rejeitado (link ou termo bloqueado)' })
    }

    let authorName = String(req.body?.authorName || '').trim().slice(0, 60)
    if (!authorName || COMMENT_BLOCK_PATTERN.test(authorName)) authorName = 'anônimo'

    const { rows: postRows } = await pool.query('SELECT 1 FROM posts WHERE slug = $1', [
      req.params.slug,
    ])
    if (postRows.length === 0) return res.status(404).json({ error: 'not found' })

    const { rows } = await pool.query(
      `INSERT INTO post_comments (slug, author_name, body)
       VALUES ($1, $2, $3)
       RETURNING id, author_name, body, created_at`,
      [req.params.slug, authorName, body]
    )
    res.status(201).json(rows[0])
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

// A SPA seta title/OG/JSON-LD via JS depois do mount (ver src/lib/seo.js) —
// funciona pra crawler que executa JS (Googlebot), mas os bots que geram
// preview de link em app de mensagem (WhatsApp, Telegram) e rede social
// (Twitter, Facebook, LinkedIn, Slack, Discord) só leem o HTML cru, então
// hoje todo link de post compartilhado mostra o título/descrição genérico
// da home. Esta rota devolve HTML pré-renderizado com meta tag real do
// post — não é pública (Caddy só expõe /api/* pra fora); o nginx do
// frontend (nginx.conf) faz proxy pra cá só quando reconhece o
// user-agent como um desses bots, mantendo visitante humano na SPA normal.
app.get('/prerender/posts/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT slug, title, excerpt, date, slot, tags FROM posts WHERE slug = $1',
      [req.params.slug]
    )
    if (rows.length === 0) return res.status(404).send('not found')

    const post = rows[0]
    const url = `${SITE_URL}/posts/${post.slug}`
    const title = `${post.title} — ${SITE_NAME}`
    const description = post.excerpt || SITE_DESCRIPTION
    const publishedIso = `${post.date}T${post.slot}:00-03:00`
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      datePublished: publishedIso,
      dateModified: publishedIso,
      url,
      description: post.excerpt,
      keywords: post.tags?.join(', '),
      author: { '@type': 'Organization', name: SITE_NAME },
      publisher: { '@type': 'Organization', name: SITE_NAME },
    }).replace(/</g, '\\u003c')

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${escapeXml(title)}</title>
<meta name="description" content="${escapeXml(description)}" />
<link rel="canonical" href="${url}" />
<meta property="og:title" content="${escapeXml(title)}" />
<meta property="og:description" content="${escapeXml(description)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:image" content="${SITE_URL}/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeXml(title)}" />
<meta name="twitter:description" content="${escapeXml(description)}" />
<meta name="twitter:image" content="${SITE_URL}/og-image.png" />
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<h1>${escapeXml(post.title)}</h1>
<p>${escapeXml(description)}</p>
<a href="${url}">${url}</a>
</body>
</html>`
    res.set('Content-Type', 'text/html; charset=utf-8')
    res.set('Cache-Control', 'public, max-age=300')
    res.send(html)
  } catch (err) {
    res.status(500).send('error')
  }
})

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
    res.set('Cache-Control', 'public, max-age=300')
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
    res.set('Cache-Control', 'public, max-age=300')
    res.send(xml)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`pulso-api listening on ${port}`)
})
