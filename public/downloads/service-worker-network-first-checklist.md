# Service worker: network-first pra não travar usuário numa versão velha

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Um service worker adicionado pra dar resiliência offline (o app continua
funcionando sem rede) costuma nascer com a estratégia mais simples de
implementar: cache-first — serve do cache se existir, só busca na rede se
não existir. Funciona perfeitamente no dia da implementação. O problema
aparece semanas depois, em produção: o navegador mantém o mesmo service
worker registrado entre sessões, e se o cache nunca é invalidado (mesma
chave de cache pra sempre, sem limpeza no `activate`), usuários que voltam
ao site recebem o HTML/JS antigo do cache — mesmo estando online, mesmo o
servidor já tendo uma versão nova no ar. Não há erro nenhum: a página
carrega, parece funcionar, só está congelada na versão de quando o cache
foi criado. A única saída pro usuário é limpar o storage do site manual-
mente nas configurações do navegador, algo que ninguém faz sem saber que
precisa.

## A lição

Cache-first é a estratégia certa só para recursos verdadeiramente imutáveis
— tipicamente arquivos com hash no nome gerados pelo build (ex.:
`/assets/app.a1b2c3.js`), onde o próprio nome já muda quando o conteúdo
muda, então servir do cache nunca entrega algo desatualizado. Para
navegação (HTML) e chamadas de API, use **network-first**: tenta a rede
primeiro, só cai pro cache quando a rede falha de verdade (offline). Assim
quem está online sempre vê o conteúdo fresco, e o cache só entra como
reforço na ausência de conexão — que é o único cenário que a resiliência
offline deveria cobrir.

Duas coisas adicionais, fáceis de esquecer e que causam o mesmo tipo de bug
silencioso:

- **Versione a chave do cache** (`pulso-v1`, `pulso-v2`...) e, no evento
  `activate`, apague qualquer chave de cache que não seja a atual. Sem
  isso, caches antigos nunca são liberados e o navegador pode continuar
  usando entradas de uma versão anterior do app.
- **`skipWaiting()` no `install`** e **`clients.claim()` no `activate`**
  fazem o service worker novo assumir o controle das abas já abertas
  imediatamente, em vez de esperar todas as abas do site serem fechadas
  manualmente (comportamento padrão do browser) — outra forma comum de
  "o deploy saiu mas ninguém vê a versão nova".

Teste o cenário que interessa de verdade: publique uma mudança visível,
recarregue a página (recarregamento normal, sem forçar cache-bust) com o
service worker antigo já registrado, e confirme que a versão nova aparece
sem precisar de hard-refresh ou limpar dados do site manualmente. Esse é o
teste que a maioria das implementações nunca faz, porque no ambiente de
desenvolvimento o service worker é reinstalado com frequência e o bug nunca
chega a se manifestar.

## Template mínimo

```js
const CACHE_VERSION = 'app-v1' // suba esse número a cada mudança de estratégia de cache

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

function isImmutableAsset(url) {
  // ajuste ao padrão de hash do seu build (Vite, Webpack, etc.)
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

  if (isImmutableAsset(url)) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (request.mode === 'navigate' || url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
  }
})
```

Adapte `isImmutableAsset` e os caminhos de API ao seu próprio projeto —
o ponto central é a separação de estratégia por tipo de recurso, não o
código exato.
