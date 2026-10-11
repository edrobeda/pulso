import { useEffect, useState } from 'react'

// Botão discreto no rodapé — só aparece quando o navegador já decidiu que o
// site é instalável (beforeinstallprompt) e ninguém instalou ainda. Sem
// isso, instalar como app (ícone na tela, abre em tela cheia, sem barra de
// endereço) depende de achar a opção escondida no menu do navegador — mais
// um passo a menos pra quem lê no celular com uma mão só (mesma motivação
// do PushSubscribeWidget). Não funciona no Safari/iOS (não expõe esse
// evento) — lá a instalação continua só via "compartilhar > adicionar à
// tela de início", fora do nosso alcance.
export default function InstallPromptWidget() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    function handleBeforeInstallPrompt(e) {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    function handleAppInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  if (!deferredPrompt || installed) return null

  async function handleInstall() {
    // Um prompt nativo só serve uma vez — guardamos o evento, chamamos
    // prompt() nele, e descartamos de qualquer forma depois (aceito ou não,
    // o navegador não deixa reusar a mesma instância).
    deferredPrompt.prompt()
    await deferredPrompt.userChoice.catch(() => {})
    setDeferredPrompt(null)
  }

  return (
    <button type="button" className="install-prompt" onClick={handleInstall}>
      📲 instalar app
    </button>
  )
}
