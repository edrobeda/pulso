// RUM (Real User Monitoring) próprio, sem serviço de terceiro — captura
// TTFB/FCP/LCP/CLS/INP reais do navegador com PerformanceObserver nativo e
// manda um POST só por sessão (ver /api/vitals em api/server.js), no
// pagehide/hidden, em vez de uma requisição por métrica.
//
// Mede só o carregamento inicial da página: LCP/CLS não têm um
// equivalente nativo confiável pra navegação client-side de SPA (o
// PerformanceObserver não reseta sozinho numa troca de rota do React
// Router), e instrumentar isso do zero é mais complexidade do que o
// dashboard em /bastidores precisa hoje.
const VITALS_ENDPOINT = '/api/vitals'

// Descritor curto de elemento (tag + até 2 classes, sem conteúdo/texto) —
// o bastante pra saber ONDE olhar no CSS sem vazar nada sensível, já que é
// só o seletor de uma classe nossa mesmo (ex. "h1.intro__title").
function describeElement(el) {
  if (!el || !el.tagName) return null
  const tag = el.tagName.toLowerCase()
  const classes = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean) : []
  const classPart = classes.slice(0, 2).join('.')
  return (classPart ? `${tag}.${classPart}` : tag).slice(0, 120)
}

export function initWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

  const path = window.location.pathname
  const metrics = {}
  const debug = {}
  let clsValue = 0
  let clsTopSource = null
  let clsTopImpact = 0
  let inpValue = 0
  let inpSource = null
  let sent = false

  try {
    const [nav] = performance.getEntriesByType('navigation')
    if (nav) metrics.ttfb = nav.responseStart
  } catch {
    // performance.timing indisponível ou navegador sem suporte — sem TTFB.
  }

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') metrics.fcp = entry.startTime
      }
    }).observe({ type: 'paint', buffered: true })
  } catch {
    // navegador sem suporte a paint timing — sem FCP.
  }

  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      if (last) {
        metrics.lcp = last.startTime
        debug.lcp = describeElement(last.element)
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    // navegador sem suporte a largest-contentful-paint — sem LCP.
  }

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue
        clsValue += entry.value
        // Guarda o elemento do maior deslocamento individual, não do
        // último — é o melhor palpite de qual CSS reservar espaço pra ele.
        if (entry.value > clsTopImpact) {
          clsTopImpact = entry.value
          const node = entry.sources?.[0]?.node
          clsTopSource = describeElement(node)
        }
      }
    }).observe({ type: 'layout-shift', buffered: true })
  } catch {
    // navegador sem suporte a layout-shift — sem CLS.
  }

  // INP de verdade é o percentil 98 de todas as interações da sessão —
  // aproximamos com a pior (maior `duration`) observada até o envio, que já
  // é o suficiente pra apontar se alguma interação travou a página (a
  // informação que importa pra decidir se vale investigar). durationThreshold
  // 40 é o mínimo que a spec garante reportar; abaixo disso o navegador pode
  // não emitir o entry.
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = entry.duration
        if (duration > inpValue) {
          inpValue = duration
          inpSource = describeElement(entry.target)
        }
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 40 })
  } catch {
    // navegador sem suporte a event timing — sem INP.
  }

  function send() {
    if (sent) return
    sent = true
    metrics.cls = clsValue
    if (clsTopSource) debug.cls = clsTopSource
    if (inpValue > 0) {
      metrics.inp = inpValue
      if (inpSource) debug.inp = inpSource
    }
    const payload = JSON.stringify({ path, metrics, debug })
    if (navigator.sendBeacon) {
      navigator.sendBeacon(VITALS_ENDPOINT, new Blob([payload], { type: 'application/json' }))
    } else {
      fetch(VITALS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') send()
  })
  window.addEventListener('pagehide', send, { once: true })
}
