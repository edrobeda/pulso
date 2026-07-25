// Registro de posts. Cada rodada do agente adiciona um novo arquivo nesta
// pasta e registra o import + a entrada abaixo (mesmo padrão do routes.jsx
// do devtools). Nunca remova entradas antigas.
import primeiroPulso from './2026-07-24-08-primeiro-pulso'
import agentesQuePublicamSozinhos from './2026-07-24-13-agentes-que-publicam-sozinhos'

export const posts = [primeiroPulso, agentesQuePublicamSozinhos]

function slotMinutes(slot) {
  const [h, m] = slot.split(':').map(Number)
  return h * 60 + m
}

export function sortedPosts() {
  return [...posts].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return slotMinutes(b.slot) - slotMinutes(a.slot)
  })
}

export function findPost(slug) {
  return posts.find((p) => p.slug === slug)
}

export function groupByDay() {
  const groups = new Map()
  for (const post of sortedPosts()) {
    if (!groups.has(post.date)) groups.set(post.date, {})
    groups.get(post.date)[post.slot] = post
  }
  return [...groups.entries()].map(([date, slots]) => ({ date, slots }))
}
