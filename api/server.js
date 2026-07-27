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

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`pulso-api listening on ${port}`)
})
