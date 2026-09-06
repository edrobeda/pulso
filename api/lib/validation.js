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

// Envolve texto num bloco CDATA seguro pra XML/RSS — a única sequência que
// não pode aparecer crua dentro de CDATA é `]]>`, que quebramos em dois
// blocos. Usado pra `<content:encoded>` do feed, onde o corpo do post vira
// HTML (não daria pra escapar como XML sem perder as tags).
export function cdata(str) {
  return `<![CDATA[${String(str == null ? '' : str).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`
}

// Renderiza os blocos de um post (mesmo shape de posts.blocks: { type, text })
// em HTML simples pra `<content:encoded>` do RSS, dando ao assinante de feed
// o texto inteiro em vez de só o excerpt. O texto de cada bloco é escapado;
// o conjunto de tags é fixo (h2/blockquote/pre/p), nunca vem do conteúdo.
export function blocksToHtml(blocks) {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map((block) => {
      const text = escapeXml(block && block.text ? block.text : '')
      switch (block && block.type) {
        case 'h2':
          return `<h2>${text}</h2>`
        case 'quote':
          return `<blockquote><p>${text}</p></blockquote>`
        case 'code':
          return `<pre><code>${text}</code></pre>`
        default:
          return `<p>${text}</p>`
      }
    })
    .join('\n')
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
