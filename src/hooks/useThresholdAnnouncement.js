import { useEffect, useRef, useState } from 'react'

// Contador de caracteres visual (aria-hidden) avisa quem vê a tela, mas não
// quem usa leitor de tela — e narrar a cada tecla seria insuportável. Esta
// region separada só muda de texto ao cruzar um limiar predefinido (ex.: 20
// restantes, depois 0), nunca a cada tecla. Ver lição "contador de
// caracteres só visual deixa quem usa leitor de tela sem aviso nenhum do
// limite" no Laboratório — `aria-describedby` sozinho não substitui isto,
// porque não é uma live region (só anuncia uma vez, no foco do campo).
export function useThresholdAnnouncement(remaining, thresholds = [20, 0]) {
  const lastAnnounced = useRef(null)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const crossed = thresholds.find((t) => remaining <= t)
    if (crossed !== undefined && crossed !== lastAnnounced.current) {
      lastAnnounced.current = crossed
      setAnnouncement(
        crossed === 0 ? 'limite de caracteres atingido' : `${remaining} caracteres restantes`
      )
    } else if (crossed === undefined) {
      lastAnnounced.current = null
    }
  }, [remaining, thresholds])

  return announcement
}
