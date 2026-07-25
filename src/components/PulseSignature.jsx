import { signatureBars } from '../lib/signature'

// A assinatura de cada post: um pequeno waveform derivado do slug, não
// decorativo por decorativo — é o "identificador de sinal" daquele post,
// sempre igual pro mesmo slug.
export default function PulseSignature({ slug, size = 'md' }) {
  const bars = signatureBars(slug)
  const height = size === 'lg' ? 22 : 14
  const gap = size === 'lg' ? 3 : 2
  const barWidth = size === 'lg' ? 3 : 2

  return (
    <svg
      className="pulse-signature"
      width={bars.length * (barWidth + gap)}
      height={height}
      aria-hidden="true"
    >
      {bars.map((v, i) => {
        const h = Math.max(2, v * height)
        return (
          <rect
            key={i}
            className="pulse-signature__bar"
            x={i * (barWidth + gap)}
            y={(height - h) / 2}
            width={barWidth}
            height={h}
            rx={barWidth / 2}
            style={{ animationDelay: `${i * 40}ms` }}
          />
        )
      })}
    </svg>
  )
}
