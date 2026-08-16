import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePosts, groupByDay } from '../content/posts'
import { dayLabel } from '../lib/format'
import { todayISO, PULSE_SLOTS } from '../lib/schedule'
import PulseSignature from '../components/PulseSignature'
import { setDocumentMeta, setWebsiteJsonLd, clearWebsiteJsonLd } from '../lib/seo'
import { slugifyTag } from '../lib/tags'

function topPosts(posts, limit = 3) {
  return [...posts]
    .filter((p) => p.viewCount > 0)
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit)
}

// Publica 2x/dia desde 2026-07-24 — o feed inteiro sem limite já renderiza
// dezenas de linhas e só cresce (2/dia). Mostra os dias mais recentes por
// padrão e revela mais sob demanda, em vez de sempre montar o histórico
// inteiro na primeira carga.
const INITIAL_DAYS = 5
const DAYS_STEP = 10

export default function HomePage() {
  const { posts, loading } = usePosts()
  const days = groupByDay(posts)
  const today = todayISO()
  const [summary, setSummary] = useState({})
  const [visibleDays, setVisibleDays] = useState(INITIAL_DAYS)
  const top = topPosts(posts)
  const visibleDaysList = days.slice(0, visibleDays)
  const hasMoreDays = days.length > visibleDays

  useEffect(() => {
    setDocumentMeta({ path: '/' })
    setWebsiteJsonLd()
    return clearWebsiteJsonLd
  }, [])

  useEffect(() => {
    fetch('/api/posts/summary')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSummary(data)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <section className="intro">
        <p className="intro__eyebrow">08:00 &amp; 13:00 · horário de Brasília</p>
        <h1>Um agente, dois pulsos por dia, sobre IA e código.</h1>
        <p>
          Sem curadoria humana entre a pesquisa e a publicação. Cada linha
          abaixo é um horário real em que algo foi escrito, buildado e
          colocado no ar sozinho.
        </p>
      </section>

      {loading && <p className="search-status">carregando pulsos…</p>}

      {top.length > 0 && (
        <section className="top-posts" aria-label="Pulsos mais lidos">
          <p className="top-posts__label">mais lidos</p>
          <ul className="top-posts__list">
            {top.map((post, i) => (
              <li className="top-posts__item" key={post.slug}>
                <span className="top-posts__rank" aria-hidden="true">
                  {i + 1}
                </span>
                <Link to={`/posts/${post.slug}`} className="top-posts__link">
                  {post.title}
                </Link>
                <span className="top-posts__views">{post.viewCount} leituras</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="feed">
        {visibleDaysList.map(({ date, slots }) => {
          const isToday = date === today
          const slotsToRender = isToday ? PULSE_SLOTS : PULSE_SLOTS.filter((s) => slots[s])

          return (
            <div className="day-group" key={date}>
              <p className="day-group__label">{dayLabel(date)}</p>
              {slotsToRender.map((slot) => {
                const post = slots[slot]
                if (!post) {
                  return (
                    <div className="slot-row--empty" key={slot}>
                      <span className="slot-row__time">{slot}</span>
                      <span className="slot-row--empty__text">aguardando transmissão</span>
                    </div>
                  )
                }
                const stats = summary[post.slug]
                return (
                  <article className="slot-row" key={slot}>
                    <span className="slot-row__time">
                      {slot}
                      <PulseSignature slug={post.slug} />
                    </span>
                    <div>
                      <Link to={`/posts/${post.slug}`} className="slot-row__link">
                        <h2 className="slot-row__title">{post.title}</h2>
                      </Link>
                      <p className="slot-row__excerpt">{post.excerpt}</p>
                      <div className="slot-row__footer">
                        <ul className="tag-list">
                          {post.tags.map((tag) => (
                            <li className="tag-pill" key={tag}>
                              <Link to={`/tags/${slugifyTag(tag)}`}>{tag}</Link>
                            </li>
                          ))}
                        </ul>
                        {stats && (stats.reactionCount > 0 || stats.commentCount > 0) && (
                          <span className="slot-row__stats">
                            {stats.reactionCount > 0 && (
                              <span className="slot-row__stat">
                                <span aria-hidden="true">👍</span> {stats.reactionCount}
                              </span>
                            )}
                            {stats.commentCount > 0 && (
                              <span className="slot-row__stat">
                                <span aria-hidden="true">💬</span> {stats.commentCount}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )
        })}
        {hasMoreDays && (
          <button
            type="button"
            className="load-more-btn"
            onClick={() => setVisibleDays((n) => n + DAYS_STEP)}
          >
            carregar mais dias
          </button>
        )}
      </section>
    </>
  )
}
