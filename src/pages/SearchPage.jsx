import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { dayLabel } from '../lib/format'
import { setDocumentMeta, setRobotsNoIndex, clearRobotsNoIndex } from '../lib/seo'
import { slugifyTag } from '../lib/tags'

// Histórico só local (nunca sai do dispositivo) das últimas buscas — pra
// quem lê no celular não precisar redigitar a mesma busca de um dia pro
// outro. Separado do /api/search/top-queries em Bastidores, que é
// agregado entre todo mundo; isto aqui é pessoal.
const RECENT_SEARCHES_KEY = 'pulso-recent-searches'
const MAX_RECENT_SEARCHES = 5

function loadRecentSearches() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function saveRecentSearch(query) {
  const trimmed = query.trim()
  if (!trimmed) return
  const current = loadRecentSearches().filter((q) => q.toLowerCase() !== trimmed.toLowerCase())
  const updated = [trimmed, ...current].slice(0, MAX_RECENT_SEARCHES)
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch {
    // localStorage indisponível (modo privado etc.) — sem histórico, sem drama.
  }
  return updated
}

function highlightMatches(text, query) {
  const trimmed = query.trim()
  if (!trimmed) return text
  const lower = text.toLowerCase()
  const needle = trimmed.toLowerCase()
  const parts = []
  let start = 0
  let idx = lower.indexOf(needle, start)
  if (idx === -1) return text
  while (idx !== -1) {
    if (idx > start) parts.push(text.slice(start, idx))
    parts.push(
      <mark className="search-highlight" key={idx}>
        {text.slice(idx, idx + needle.length)}
      </mark>
    )
    start = idx + needle.length
    idx = lower.indexOf(needle, start)
  }
  if (start < text.length) parts.push(text.slice(start))
  return parts
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [input, setInput] = useState(query)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => loadRecentSearches())

  useEffect(() => {
    setDocumentMeta({ title: 'Busca', path: '/busca' })
    setRobotsNoIndex()
    return clearRobotsNoIndex
  }, [])

  useEffect(() => {
    setInput(query)
  }, [query])

  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }
    const updated = saveRecentSearch(trimmed)
    if (updated) setRecentSearches(updated)
    let cancelled = false
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setResults(data)
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [query])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = input.trim()
    setSearchParams(trimmed ? { q: trimmed } : {})
  }

  return (
    <>
      <section className="intro">
        <p className="intro__eyebrow">busca</p>
        <h1>Procurar nos pulsos.</h1>
        <form className="search-form" onSubmit={handleSubmit} role="search">
          <input
            type="search"
            className="search-form__input"
            placeholder="título, tag ou palavra no texto"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            aria-label="Buscar pulsos"
            autoFocus
          />
          <button type="submit" className="search-form__submit">
            buscar
          </button>
        </form>
        {!query.trim() && recentSearches.length > 0 && (
          <div className="recent-searches">
            <span className="recent-searches__label">buscas recentes:</span>
            <ul className="tag-list">
              {recentSearches.map((q) => (
                <li className="tag-pill" key={q}>
                  <Link to={`/busca?q=${encodeURIComponent(q)}`}>{q}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="feed">
        {query.trim() && loading && <p className="search-status">carregando…</p>}
        {query.trim() && !loading && (
          <p className="search-status">
            {results.length === 0
              ? `nenhum resultado pra "${query}"`
              : `${results.length} resultado${results.length === 1 ? '' : 's'} pra "${query}"`}
          </p>
        )}
        <div className="day-group">
          {results.map((post) => (
            <article className="slot-row" key={post.slug}>
              <span className="slot-row__time">{dayLabel(post.date)}</span>
              <div>
                <Link to={`/posts/${post.slug}`} className="slot-row__link">
                  <h2 className="slot-row__title">{highlightMatches(post.title, query)}</h2>
                </Link>
                <p className="slot-row__excerpt">{highlightMatches(post.excerpt, query)}</p>
                <ul className="tag-list">
                  {post.tags.map((tag) => (
                    <li className="tag-pill" key={tag}>
                      <Link to={`/tags/${slugifyTag(tag)}`}>{tag}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
