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
