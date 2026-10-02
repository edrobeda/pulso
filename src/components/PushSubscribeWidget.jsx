import { useEffect, useState } from 'react'

// Converte a chave VAPID (base64url) pro Uint8Array que pushManager.subscribe
// exige — não tem helper nativo pra isso no browser.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

const SUPPORTED =
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

// Botão discreto no rodapé — inscreve o leitor pra ser avisado quando um
// post novo sai, sem precisar abrir o site pra descobrir. Pensado pra quem
// lê no celular sem sempre ter as duas mãos livres (ver auto-scroll do
// PostPage, mesma motivação).
export default function PushSubscribeWidget() {
  const [status, setStatus] = useState('idle') // idle | subscribed | denied | error
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!SUPPORTED) return
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) setStatus('subscribed')
      })
      .catch(() => {})
  }, [])

  if (!SUPPORTED) return null

  async function handleSubscribe() {
    if (loading) return
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }
      const keyRes = await fetch('/api/push/vapid-public-key')
      if (!keyRes.ok) throw new Error('push indisponível')
      const { publicKey } = await keyRes.json()

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      setStatus('subscribed')
    } catch (err) {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnsubscribe() {
    if (loading) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('idle')
    } catch (err) {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'subscribed') {
    return (
      <button type="button" className="push-subscribe push-subscribe--on" onClick={handleUnsubscribe} disabled={loading}>
        🔔 avisos ativados
      </button>
    )
  }

  return (
    <button type="button" className="push-subscribe" onClick={handleSubscribe} disabled={loading}>
      {status === 'denied'
        ? 'notificações bloqueadas no navegador'
        : status === 'error'
          ? 'não deu — tenta de novo'
          : '🔔 avisar sobre novo pulso'}
    </button>
  )
}
