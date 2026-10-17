import { useEffect, useState } from 'react'

// O site já tem pré-cache offline pra posts salvos (sw.js, network-first
// com fallback pro cache) e feedback por leitor é feito de uma mão só no
// celular — mas nada hoje avisa quando a conexão cai, então quem perde
// sinal (elevador, metrô) não sabe se o conteúdo que está vendo é só o que
// já foi salvo, ou por que uma ação (reação, comentário) não vai completar.
// Banner discreto, sem bloquear a leitura, que aparece/some sozinho.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)

  useEffect(() => {
    function handleOnline() {
      setOffline(false)
    }
    function handleOffline() {
      setOffline(true)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="offline-banner" role="status">
      sem conexão — mostrando o que já foi salvo offline
    </div>
  )
}
