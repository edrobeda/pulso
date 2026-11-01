import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePosts, groupByMonth } from '../content/posts'
import { monthYearLabel, shortDayLabel } from '../lib/format'
import { setDocumentMeta } from '../lib/seo'

export default function ArchivePage() {
  const { posts, loading } = usePosts()
  const months = groupByMonth(posts)

  useEffect(() => {
    setDocumentMeta({
      title: 'Arquivo',
      description: 'Todos os pulsos publicados, por mês — do mais recente ao mais antigo.',
      path: '/arquivo',
    })
  }, [])

  if (loading) return <p className="search-status">carregando…</p>

  return (
    <section className="feed">
      <div className="intro">
        <p className="intro__eyebrow">arquivo</p>
        <h1>Todos os pulsos, por mês.</h1>
        <p>{posts.length} pulsos publicados até agora.</p>
      </div>
      <div className="archive">
        {months.map(({ monthKey, posts: monthPosts }) => (
          <div className="archive__month" key={monthKey}>
            <h2 className="archive__month-label">{monthYearLabel(monthKey)}</h2>
            <ul className="archive__list">
              {monthPosts.map((post) => (
                <li className="archive__item" key={post.slug}>
                  <time dateTime={post.date} className="archive__date">
                    {shortDayLabel(post.date)}
                  </time>
                  <Link to={`/posts/${post.slug}`} className="archive__link">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
