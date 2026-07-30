import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { postsByTagSlug, tagLabelFromSlug, slugifyTag } from '../lib/tags'
import { dayLabel } from '../lib/format'
import { setDocumentMeta } from '../lib/seo'

export default function TagPage() {
  const { tag } = useParams()
  const posts = postsByTagSlug(tag)
  const label = tagLabelFromSlug(tag)

  useEffect(() => {
    setDocumentMeta({
      title: `Tag: ${label}`,
      description: `Pulsos publicados sob a tag "${label}".`,
      path: `/tags/${tag}`,
    })
  }, [tag, label])

  if (posts.length === 0) return <Navigate to="/404" replace />

  return (
    <section className="feed">
      <div className="intro">
        <p className="intro__eyebrow">tag</p>
        <h1>{label}</h1>
      </div>
      <div className="day-group">
        {posts.map((post) => (
          <article className="slot-row" key={post.slug}>
            <span className="slot-row__time">{dayLabel(post.date)}</span>
            <div>
              <Link to={`/posts/${post.slug}`} className="slot-row__link">
                <h2 className="slot-row__title">{post.title}</h2>
              </Link>
              <p className="slot-row__excerpt">{post.excerpt}</p>
              <ul className="tag-list">
                {post.tags.map((t) => (
                  <li className="tag-pill" key={t}>
                    <Link to={`/tags/${slugifyTag(t)}`}>{t}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
