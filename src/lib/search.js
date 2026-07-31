import { sortedPosts } from '../content/posts'

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function blocksText(post) {
  return (post.blocks || [])
    .map((block) => block.text || '')
    .join(' ')
}

let cachedIndex = null

function buildIndex() {
  return sortedPosts().map((post) => ({
    post,
    haystack: normalize(
      [post.title, post.excerpt, ...(post.tags || []), blocksText(post)].join(' ')
    ),
  }))
}

/**
 * Busca simples por substring, sem lib externa: o corpus é pequeno (uma
 * dezena de posts por enquanto) e cresce devagar, então não vale o peso de
 * bundle de um motor de busca de verdade. Título e trecho pesam mais que o
 * corpo do post na ordenação.
 */
export function searchPosts(query) {
  const q = normalize(query.trim())
  if (!q) return []

  if (!cachedIndex) cachedIndex = buildIndex()

  const results = []
  for (const { post, haystack } of cachedIndex) {
    if (!haystack.includes(q)) continue
    const inTitle = normalize(post.title).includes(q)
    const inExcerpt = normalize(post.excerpt).includes(q)
    const score = (inTitle ? 2 : 0) + (inExcerpt ? 1 : 0)
    results.push({ post, score })
  }

  results.sort((a, b) => b.score - a.score)
  return results.map((r) => r.post)
}
