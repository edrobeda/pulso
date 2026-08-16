const KEY = 'pulso-saved'

export function getSavedSlugs() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function isSaved(slug) {
  return getSavedSlugs().includes(slug)
}

export function toggleSaved(slug) {
  const current = getSavedSlugs()
  const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
