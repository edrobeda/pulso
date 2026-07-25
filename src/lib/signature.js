// Cada post tem uma "assinatura" — uma sequência de barras derivada de um
// hash do slug, não aleatória. É o mesmo post, sempre a mesma assinatura.
export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function signatureBars(slug, count = 9) {
  const seed = hashString(slug)
  const bars = []
  let x = seed
  for (let i = 0; i < count; i++) {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    x >>>= 0
    bars.push(0.22 + (x % 1000) / 1000 * 0.78)
  }
  return bars
}
