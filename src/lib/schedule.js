// Os dois horários fixos de transmissão, sempre em horário de Brasília,
// independente do fuso do servidor onde isso roda.
const SLOTS = ['08:00', '13:00']
const TIME_ZONE = 'America/Sao_Paulo'

function saoPauloParts(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type)?.value
  return { hour: Number(get('hour')), minute: Number(get('minute')) }
}

export function todayISO(now = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE })
  return fmt.format(now) // en-CA formats as YYYY-MM-DD
}

export const PULSE_SLOTS = SLOTS

export function nextPulseLabel(now = new Date()) {
  const { hour, minute } = saoPauloParts(now)
  const minutesNow = hour * 60 + minute
  const slotMinutes = SLOTS.map((s) => {
    const [h, m] = s.split(':').map(Number)
    return h * 60 + m
  })

  let target = slotMinutes.find((m) => m > minutesNow)
  let daysAhead = 0
  if (target === undefined) {
    target = slotMinutes[0]
    daysAhead = 1
  }

  let diff = target - minutesNow + daysAhead * 24 * 60
  const hoursLeft = Math.floor(diff / 60)
  const minutesLeft = diff % 60

  if (hoursLeft <= 0) return `${minutesLeft}min`
  return `${hoursLeft}h${String(minutesLeft).padStart(2, '0')}`
}
