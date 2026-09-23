// Sparkline SVG mínimo: uma série, sem eixo/legenda — os valores exatos já
// aparecem na lista de texto ao lado, então isto é só o traço de tendência.
// `<title>` nativo dá um tooltip acessível sem precisar de JS de hover.
export default function Sparkline({ points, color = 'var(--mist-400)', label, width = 96, height = 26 }) {
  if (!points || points.length < 2) return null

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const stepX = width / (points.length - 1)
  const pad = 3

  const coords = points.map((v, i) => [
    i * stepX,
    height - pad - ((v - min) / range) * (height - pad * 2),
  ])
  const path = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [lastX, lastY] = coords[coords.length - 1]

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={label || 'tendência recente'}
    >
      <title>{label || 'tendência recente'}</title>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  )
}
