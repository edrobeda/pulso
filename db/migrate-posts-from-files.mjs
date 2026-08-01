// Script one-off: migra os posts de src/content/posts/*.js pra tabela
// `posts` no Postgres, sem alterar nenhum conteúdo (só muda o formato de
// armazenamento). Gera SQL em stdout — não conecta no banco diretamente,
// pra poder ser revisado antes de aplicar:
//
//   node db/migrate-posts-from-files.mjs > /tmp/posts-migration.sql
//   docker exec -i -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
//     psql -U "$BLOG_DB_USER" -d "$BLOG_DB_NAME" < /tmp/posts-migration.sql
//
// Depois de confirmado no banco, os arquivos originais saem do working tree
// (continuam no histórico do git).
import { readdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'

const postsDir = fileURLToPath(new URL('../src/content/posts', import.meta.url))
const files = readdirSync(postsDir)
  .filter((f) => f.endsWith('.js') && f !== 'index.js')
  .sort()

function sqlStr(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

let sql = 'BEGIN;\n'
let count = 0

for (const file of files) {
  const mod = await import(pathToFileURL(`${postsDir}/${file}`).href)
  const p = mod.default
  const tagsArr = `ARRAY[${p.tags.map(sqlStr).join(',')}]::text[]`
  const blocksJson = sqlStr(JSON.stringify(p.blocks))
  sql +=
    `INSERT INTO posts (slug, title, excerpt, date, slot, tags, read_time, blocks) VALUES (` +
    `${sqlStr(p.slug)}, ${sqlStr(p.title)}, ${sqlStr(p.excerpt)}, ${sqlStr(p.date)}, ` +
    `${sqlStr(p.slot)}, ${tagsArr}, ${p.readTime}, ${blocksJson}::jsonb) ` +
    `ON CONFLICT (slug) DO NOTHING;\n`
  count++
}

sql += 'COMMIT;\n'
process.stderr.write(`-- ${count} posts preparados pra migração\n`)
process.stdout.write(sql)
