import { useEffect, useState } from 'react'

const SHOW_AFTER_PX = 480

// Botão flutuante global (todas as páginas via Layout) — aparece só depois
// de rolar o suficiente pra valer a pena, fica no canto esquerdo pra nunca
// colidir com o botão de leitura automática do PostPage (que ocupa o canto
// direito). Pensado pro mesmo cenário de leitura com uma mão só: depois de
// ler um pulso ou o /bastidores inteiro, voltar ao topo sem precisar
// arrastar o dedo por uma rolagem longa.
export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  function handleClick() {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return (
    <button type="button" className="back-to-top" onClick={handleClick} aria-label="Voltar ao topo da página">
      ↑
    </button>
  )
}
