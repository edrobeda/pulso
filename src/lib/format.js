export function dayLabel(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    weekday: 'long',
  })
    .format(date)
    .replace('.', '')
    .toUpperCase()
}

export function postDateTimeLabel(post) {
  return `${dayLabel(post.date)} · ${post.slot}`
}

export function monthYearLabel(monthKey) {
  const date = new Date(`${monthKey}-01T12:00:00`)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function shortDayLabel(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(date)
    .replace('.', '')
}

export function commentDateLabel(isoTimestamp) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(isoTimestamp))
    .replace('.', '')
}
