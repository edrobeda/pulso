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

// /api/search foge da regra acima: cada query é livre (`q` variando), então
// o Cache-Control de 30s não amortece nada, e a query varre unaccent(ILIKE)
// em 4 colunas por post — incluindo o corpo inteiro em JSON — sem índice.
// Sem limite, um script batendo com querystring aleatória forçaria scan
// completo da tabela a cada request.
const searchLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
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

// Analytics próprio (sem terceiros): uma visita conta no máximo uma vez por
// dispositivo por dia — o frontend deduplica via localStorage antes de
// chamar isso, então isso não é pageview bruto, é "visitantes únicos/dia".
app.post('/api/visits', writeLimiter, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `INSERT INTO site_visits (visit_date, visit_count)
       VALUES (CURRENT_DATE, 1)
       ON CONFLICT (visit_date) DO UPDATE SET visit_count = site_visits.visit_count + 1
       RETURNING visit_count`
    )
    res.json({ visitCount: Number(rows[0].visit_count) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/visits', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT visit_date, visit_count FROM site_visits ORDER BY visit_date DESC LIMIT 14`
    )
    res.set('Cache-Control', 'public, max-age=60')
    res.json(rows.map((r) => ({ date: r.visit_date, count: Number(r.visit_count) })))
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

// Lista leve (sem `blocks`) — usada pra home, tags, busca e relacionados,
// que só precisam de metadado. Publica 2x/dia desde 2026-07-24, então esse
// payload só cresce; antes trazia `blocks` (corpo inteiro) de todo post em
// toda visita, o que ia ficar cada vez mais pesado sem limite. O corpo
// completo de um post só é buscado sob demanda em `/api/posts/:slug`.
app.get('/api/posts', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.slug, p.title, p.excerpt, p.date, p.slot, p.tags, p.read_time,
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

// Contagem agregada de reações e comentários por post, pra home mostrar de
// relance sem precisar de N chamadas (uma por post) — pedido do Edson, ver
// NECESSIDADES.md 2026-08-08.
app.get('/api/posts/summary', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.slug,
              COALESCE(r.reaction_count, 0) AS reaction_count,
              COALESCE(c.comment_count, 0) AS comment_count
       FROM posts p
       LEFT JOIN (
         SELECT slug, SUM(count) AS reaction_count FROM post_reactions GROUP BY slug
       ) r ON r.slug = p.slug
       LEFT JOIN (
         SELECT slug, COUNT(*) AS comment_count FROM post_comments WHERE visible = true GROUP BY slug
       ) c ON c.slug = p.slug`
    )
    const summary = Object.fromEntries(
      rows.map((row) => [
        row.slug,
        { reactionCount: Number(row.reaction_count), commentCount: Number(row.comment_count) },
      ])
    )
    res.set('Cache-Control', 'public, max-age=30')
    res.json(summary)
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

// Sinalizar comentário como spam/problema (sem autenticação, ver
// db/migrations/0010_comment_flags.sql). `clientToken` é gerado e guardado
// no localStorage do navegador de quem sinaliza (mesmo padrão das reações),
// impedindo re-envio infinito do mesmo cliente via UNIQUE(comment_id,
// client_token); depois de FLAG_HIDE_THRESHOLD clientes distintos
// sinalizarem o mesmo comentário, ele vira invisible automaticamente —
// mesma coluna `visible` que já serve de válvula de escape manual.
const FLAG_HIDE_THRESHOLD = 3

app.post('/api/comments/:id/flag', writeLimiter, async (req, res) => {
  try {
    const commentId = Number(req.params.id)
    if (!Number.isInteger(commentId)) return res.status(400).json({ error: 'invalid comment id' })

    const clientToken = String(req.body?.clientToken || '').trim().slice(0, 100)
    if (!clientToken) return res.status(400).json({ error: 'clientToken required' })

    const { rows: commentRows } = await pool.query(
      'SELECT id FROM post_comments WHERE id = $1 AND visible = true',
      [commentId]
    )
    if (commentRows.length === 0) return res.status(404).json({ error: 'not found' })

    await pool.query(
      `INSERT INTO comment_flags (comment_id, client_token)
       VALUES ($1, $2)
       ON CONFLICT (comment_id, client_token) DO NOTHING`,
      [commentId, clientToken]
    )

    const { rows: countRows } = await pool.query(
      'SELECT count(*)::int AS count FROM comment_flags WHERE comment_id = $1',
      [commentId]
    )
    const flagCount = countRows[0].count

    if (flagCount >= FLAG_HIDE_THRESHOLD) {
      await pool.query('UPDATE post_comments SET visible = false WHERE id = $1', [commentId])
    }

    res.json({ flagCount, hidden: flagCount >= FLAG_HIDE_THRESHOLD })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Reports de problema enviados por visitante (pedido do Edson, ver
// NECESSIDADES.md 2026-08-16) — mesma filosofia de moderação heurística dos
// comentários (honeypot + limite de tamanho + bloqueio de link/spam) em vez
// de fila manual, já que também não tem autenticação.
const BUG_REPORT_MIN_LEN = 3
const BUG_REPORT_MAX_LEN = 2000

app.post('/api/bug-reports', writeLimiter, async (req, res) => {
  try {
    if (req.body?.website) return res.status(400).json({ error: 'invalid' })

    const message = String(req.body?.message || '').trim()
    if (message.length < BUG_REPORT_MIN_LEN || message.length > BUG_REPORT_MAX_LEN) {
      return res.status(400).json({ error: 'mensagem precisa ter entre 3 e 2000 caracteres' })
    }
    if (COMMENT_BLOCK_PATTERN.test(message)) {
      return res.status(400).json({ error: 'mensagem rejeitada (link ou termo bloqueado)' })
    }

    const urlPagina = String(req.body?.urlPagina || '').trim().slice(0, 300)
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 300)

    const { rows } = await pool.query(
      `INSERT INTO bug_reports (message, url_pagina, user_agent)
       VALUES ($1, $2, $3)
       RETURNING id, message, url_pagina, created_at`,
      [message, urlPagina, userAgent]
    )
    res.status(201).json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/bug-reports', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, message, url_pagina, created_at
       FROM bug_reports
       ORDER BY created_at DESC
       LIMIT 50`
    )
    res.set('Cache-Control', 'public, max-age=30')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Comentário passa pela heurística de moderação em POST /api/posts/:slug/comments
// e vai ao ar sem revisão humana — esta rota dá visibilidade agregada (todos
// os posts, não só um de cada vez) pra pegar o que a heurística deixar
// passar, mesmo padrão de "reportados por leitores" já usado pra bug_reports.
app.get('/api/comments/recent', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.slug, p.title AS post_title, c.author_name, c.body, c.created_at
       FROM post_comments c
       JOIN posts p ON p.slug = c.slug
       WHERE c.visible = true
       ORDER BY c.created_at DESC
       LIMIT 50`
    )
    res.set('Cache-Control', 'public, max-age=30')
    res.json(rows)
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

// Busca por substring (título, trecho, tags e corpo do post), acento-
// insensível via extensão `unaccent` (ver db/migrations/0008). Título/trecho
// pesam mais que o corpo na ordenação, mesmo critério que a busca client-side
// usava antes de `/api/posts` parar de trazer `blocks` pra todo post em toda
// visita — a busca virou o único lugar que precisa olhar o corpo do post,
// então faz mais sentido fazer isso no banco do que baixar tudo pro cliente.
app.get('/api/search', searchLimiter, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) return res.json([])
    const like = `%${q}%`
    const { rows } = await pool.query(
      `SELECT p.slug, p.title, p.excerpt, p.date, p.slot, p.tags, p.read_time,
              COALESCE(v.view_count, 0) AS view_count
       FROM posts p
       LEFT JOIN post_views v ON v.slug = p.slug
       WHERE unaccent(p.title) ILIKE unaccent($1)
          OR unaccent(p.excerpt) ILIKE unaccent($1)
          OR unaccent(array_to_string(p.tags, ' ')) ILIKE unaccent($1)
          OR unaccent(p.blocks::text) ILIKE unaccent($1)
       ORDER BY
         (CASE WHEN unaccent(p.title) ILIKE unaccent($1) THEN 2 ELSE 0 END
          + CASE WHEN unaccent(p.excerpt) ILIKE unaccent($1) THEN 1 ELSE 0 END) DESC,
         p.date DESC, p.slot DESC
       LIMIT 50`,
      [like]
    )
    res.set('Cache-Control', 'public, max-age=30')
    res.json(rows.map(toPost))
  } catch (err) {
    res.status(500).json({ error: err.message })
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

// RSS filtrado por tag — mesmo shape de /feed.xml, mas só com os posts que
// carregam essa tag (slug de tag, mesmo formato de /tags/:tag no frontend).
// Fica sob /api/* de propósito (diferente de /feed.xml e /sitemap.xml, que
// vivem na raiz): só /api/* tem rota garantida no Caddy sem exigir mudança
// de infra fora do escopo deste agente.
app.get('/api/feed/tags/:tagSlug', async (req, res) => {
  try {
    const { tagSlug } = req.params
    const { rows } = await pool.query(
      `SELECT slug, title, excerpt, date, slot, tags FROM posts ORDER BY date DESC, slot DESC`
    )
    const matching = rows.filter((p) => p.tags.some((t) => slugifyTag(t) === tagSlug))
    if (matching.length === 0) return res.status(404).send('tag não encontrada')

    const tagLabel = matching[0].tags.find((t) => slugifyTag(t) === tagSlug)
    const items = matching
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
    <title>${SITE_NAME} — ${escapeXml(tagLabel)}</title>
    <link>${SITE_URL}/tags/${tagSlug}</link>
    <description>Pulsos de ${SITE_NAME} sob a tag "${escapeXml(tagLabel)}"</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${SITE_URL}/api/feed/tags/${tagSlug}" rel="self" type="application/rss+xml" />
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
      { path: '/tags', changefreq: 'weekly', priority: '0.4' },
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
