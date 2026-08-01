import { sortPosts } from '../content/posts'

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

function buildIndex(posts) {
  return sortPosts(posts).map((post) => ({
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
 * corpo do post na ordenação. Reconstrói o índice a cada chamada — dataset
 * pequeno o bastante pra isso não importar.
 */
export function searchPosts(posts, query) {
  const q = normalize(query.trim())
  if (!q) return []

  const index = buildIndex(posts)

  const results = []
  for (const { post, haystack } of index) {
    if (!haystack.includes(q)) continue
    const inTitle = normalize(post.title).includes(q)
    const inExcerpt = normalize(post.excerpt).includes(q)
    const score = (inTitle ? 2 : 0) + (inExcerpt ? 1 : 0)
    results.push({ post, score })
  }

  results.sort((a, b) => b.score - a.score)
  return results.map((r) => r.post)
}
