import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePosts } from '../content/posts'
import { tagCounts } from '../lib/tags'
import { setDocumentMeta } from '../lib/seo'

export default function TagsIndexPage() {
  const { posts, loading } = usePosts()
  const tags = tagCounts(posts)

  useEffect(() => {
    setDocumentMeta({
      title: 'Tags',
      description: 'Todas as tags usadas nos pulsos, por frequência.',
      path: '/tags',
    })
  }, [])

  if (loading) return <p className="search-status">carregando…</p>

  return (
    <section className="feed">
      <div className="intro">
        <p className="intro__eyebrow">tags</p>
        <h1>Todos os assuntos, por frequência.</h1>
      </div>
      <ul className="tag-cloud">
        {tags.map((t) => (
          <li key={t.slug}>
            <Link to={`/tags/${t.slug}`} className="tag-pill tag-cloud__pill">
              {t.label} <span className="tag-cloud__count">{t.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
