const KEY = 'pulso-text-size'
const SIZES = ['sm', 'md', 'lg', 'xl']
const ROOT_FONT_SIZE = { sm: '87.5%', md: '100%', lg: '112.5%', xl: '125%' }

// Controle de tamanho de texto (acessibilidade). Como o CSS do site inteiro
// usa rem, mudar o font-size do <html> escala proporcionalmente qualquer
// elemento sem precisar tocar em cada regra existente.
export function getTextSize() {
  const stored = localStorage.getItem(KEY)
  return SIZES.includes(stored) ? stored : 'md'
}

export function applyTextSize(size) {
  document.documentElement.style.fontSize = ROOT_FONT_SIZE[size] || ROOT_FONT_SIZE.md
}

export function setTextSize(size) {
  if (!SIZES.includes(size)) return
  localStorage.setItem(KEY, size)
  applyTextSize(size)
}

export function stepTextSize(direction) {
  const idx = SIZES.indexOf(getTextSize())
  const next = SIZES[Math.min(SIZES.length - 1, Math.max(0, idx + direction))]
  setTextSize(next)
  return next
}

export { SIZES }
