// RUM (Real User Monitoring) próprio, sem serviço de terceiro — captura
// TTFB/FCP/LCP/CLS reais do navegador com PerformanceObserver nativo e
// manda um POST só por sessão (ver /api/vitals em api/server.js), no
// pagehide/hidden, em vez de uma requisição por métrica.
//
// Mede só o carregamento inicial da página: LCP/CLS não têm um
// equivalente nativo confiável pra navegação client-side de SPA (o
// PerformanceObserver não reseta sozinho numa troca de rota do React
// Router), e instrumentar isso do zero é mais complexidade do que o
// dashboard em /bastidores precisa hoje.
const VITALS_ENDPOINT = '/api/vitals'

export function initWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

  const path = window.location.pathname
  const metrics = {}
  let clsValue = 0
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
      if (last) metrics.lcp = last.startTime
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch {
    // navegador sem suporte a largest-contentful-paint — sem LCP.
  }

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) clsValue += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  } catch {
    // navegador sem suporte a layout-shift — sem CLS.
  }

  function send() {
    if (sent) return
    sent = true
    metrics.cls = clsValue
    const payload = JSON.stringify({ path, metrics })
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
