import { useEffect } from 'react'

// Fecha um painel/form dispensável ao apertar Esc e devolve o foco pro
// elemento que o abriu — sem isso, quem navega por teclado (ou está com uma
// mão só ocupada e prefere Esc a tocar de novo no botão) perde a posição ao
// ser fechado de volta pra um elemento que já não existe. Ver lição
// "painel-dispensavel-sem-esc-nem-foco-prende-teclado" no laboratório: essa
// lógica foi duplicada à mão duas vezes antes desta extração, e só uma cópia
// lembrou de devolver o foco.
export function useEscapeToClose(isOpen, onClose, triggerRef) {
  useEffect(() => {
    if (!isOpen) return
    function handleKeydown(e) {
      if (e.key === 'Escape') {
        onClose()
        triggerRef?.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [isOpen, onClose, triggerRef])
}
