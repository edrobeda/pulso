import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchPosts } from '../lib/search'
import { dayLabel } from '../lib/format'
import { setDocumentMeta, setRobotsNoIndex, clearRobotsNoIndex } from '../lib/seo'
import { slugifyTag } from '../lib/tags'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [input, setInput] = useState(query)

  useEffect(() => {
    setDocumentMeta({ title: 'Busca', path: '/busca' })
    setRobotsNoIndex()
    return clearRobotsNoIndex
  }, [])

  useEffect(() => {
    setInput(query)
  }, [query])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = input.trim()
    setSearchParams(trimmed ? { q: trimmed } : {})
  }

  const results = query.trim() ? searchPosts(query) : []

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
      </section>

      <section className="feed">
        {query.trim() && (
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
                  <h2 className="slot-row__title">{post.title}</h2>
                </Link>
                <p className="slot-row__excerpt">{post.excerpt}</p>
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
