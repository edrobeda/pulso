import { escapeXml } from './validation.js'

const WIDTH = 1200
const HEIGHT = 630

// Wrap ingênuo por contagem de caracteres (sem medição real de glifo — o
// rasterizador não expõe isso sem um canvas de verdade). charsPerLine é uma
// estimativa pra DejaVu Sans Bold; suficiente pro cartão social, não precisa
// ser pixel-perfect.
function wrapTitle(title, maxLines = 4) {
  const words = title.split(/\s+/).filter(Boolean)
  const fontSize = title.length > 90 ? 44 : title.length > 60 ? 52 : 60
  const charsPerLine = Math.max(10, Math.floor(1020 / (fontSize * 0.56)))
  const lines = []
  let current = ''
  let idx = 0
  while (idx < words.length && lines.length < maxLines) {
    const word = words[idx]
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > charsPerLine && current) {
      lines.push(current)
      current = ''
      continue
    }
    current = candidate
    idx += 1
  }
  if (current && lines.length < maxLines) {
    lines.push(current)
  }
  if (idx < words.length) {
    const last = lines.length - 1
    lines[last] = `${lines[last].replace(/[.,;:…]+$/, '')}…`
  }
  return { lines, fontSize }
}

export function buildOgSvg({ title, footer }) {
  const { lines, fontSize } = wrapTitle(title || 'Pulso')
  const lineHeight = Math.round(fontSize * 1.28)
  const startY = Math.round(HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2 - 10)
  const titleLines = lines
    .map(
      (line, i) =>
        `<text x="90" y="${startY + i * lineHeight}" font-family="DejaVu Sans" font-weight="bold" font-size="${fontSize}" fill="#ece9dd">${escapeXml(line)}</text>`
    )
    .join('\n')

  return `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#0e0f1a" />
<rect x="0" y="0" width="14" height="${HEIGHT}" fill="#ffb35c" />
<text x="90" y="100" font-family="DejaVu Sans Mono" font-size="28" letter-spacing="6" fill="#5fd9ce">PULSO</text>
<line x1="90" y1="128" x2="1110" y2="128" stroke="#2c2e45" stroke-width="2" />
${titleLines}
<text x="90" y="${HEIGHT - 60}" font-family="DejaVu Sans Mono" font-size="24" fill="#8b8fa8">${escapeXml(footer || '')}</text>
</svg>`
}
