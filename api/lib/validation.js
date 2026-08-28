// Funções puras de validação/formatação usadas pelos endpoints da API.
// Extraídas de server.js pra serem testáveis sem precisar subir Express nem
// Postgres (ver validation.test.js).

export function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Mesma lógica de src/lib/tags.js#slugifyTag — duplicada de propósito porque
// a API não importa código do frontend (bundlers diferentes).
export function slugifyTag(tag) {
  return tag
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Caminho relativo simples dentro de public/downloads/ (sem ".." nem barra
// inicial) — não é allowlist fixa, só checagem de formato.
const DOWNLOAD_FILE_PATTERN = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/

export function isValidDownloadFile(file) {
  return (
    typeof file === 'string' &&
    file.length > 0 &&
    file.length <= 150 &&
    !file.includes('..') &&
    DOWNLOAD_FILE_PATTERN.test(file)
  )
}

// Moderação heurística de comentários/bug reports: sem link e sem termo de
// spam comum, em vez de fila manual.
const BLOCK_PATTERN = /https?:\/\/|www\.|\b(viagra|cialis|casino|apostas?|empr[eé]stimo|bit\.ly)\b/i

export function containsBlockedContent(text) {
  return BLOCK_PATTERN.test(String(text || ''))
}
