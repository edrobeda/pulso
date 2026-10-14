// Mesmo nome de cache do service worker (public/sw.js, CACHE_VERSION) —
// tem que ficar em sincronia manualmente já que um é módulo ES e o outro é
// script clássico de SW, sem import compartilhado entre os dois.
const CACHE_VERSION = 'pulso-v1'

/**
 * Pré-carrega um post salvo pra leitura offline garantida, sem depender do
 * visitante ter revisitado a página enquanto estava online (o SW já cacheia
 * oportunisticamente em toda navegação, isso só cobre o caso de salvar e
 * nunca mais abrir enquanto há rede). Cobre tanto a navegação da rota (SPA
 * shell) quanto os dados da API que a página busca pra montar o post.
 */
export async function precachePostOffline(slug) {
  if (!('caches' in window)) return
  try {
    const cache = await caches.open(CACHE_VERSION)
    await Promise.all(
      [`/posts/${slug}`, `/api/posts/${slug}`].map(async (url) => {
        const response = await fetch(url)
        if (response.ok) await cache.put(url, response)
      })
    )
  } catch {
    // best-effort — se falhar (offline no momento de salvar, ou Cache API
    // indisponível), o post só não fica garantido offline, nada quebra
  }
}

export async function dropPostOfflineCache(slug) {
  if (!('caches' in window)) return
  try {
    const cache = await caches.open(CACHE_VERSION)
    await Promise.all([cache.delete(`/posts/${slug}`), cache.delete(`/api/posts/${slug}`)])
  } catch {
    // best-effort, ver precachePostOffline
  }
}
