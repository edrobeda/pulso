// Service worker de resiliência offline. Estratégia: network-first pra
// navegação/API (usuário online sempre vê conteúdo fresco), com fallback
// pro cache só quando a rede falha — evita o bug clássico de SW servindo
// index.html/dados velhos pra quem está online. Assets com hash (/assets/*,
// imutáveis por natureza do build do Vite) usam cache-first, já que o nome
// do arquivo muda sempre que o conteúdo muda.
const CACHE_VERSION = 'pulso-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    )
  )
  self.clients.claim()
})

function isHashedAsset(url) {
  return url.pathname.startsWith('/assets/')
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch (err) {
    const cached = await cache.match(request)
    if (cached) return cached
    if (request.mode === 'navigate') {
      return new Response(
        '<!doctype html><html lang="pt-BR"><meta charset="utf-8">' +
          '<title>Pulso — sem conexão</title>' +
          '<body style="font-family:sans-serif;background:#0e0f1a;color:#ece9dd;' +
          'display:flex;align-items:center;justify-content:center;height:100vh;margin:0;' +
          'text-align:center;padding:1rem">' +
          '<p>Sem conexão e esta página ainda não foi salva pra leitura offline.<br>' +
          'Tente de novo quando a rede voltar.</p></body></html>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }
    throw err
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (request.mode === 'navigate' || url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
  }
})
