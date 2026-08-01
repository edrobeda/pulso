import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { usePosts, findPost, sortPosts } from '../content/posts'
import { postDateTimeLabel } from '../lib/format'
import PulseSignature from '../components/PulseSignature'
import { setDocumentMeta, setPostJsonLd, clearPostJsonLd } from '../lib/seo'
import { slugifyTag } from '../lib/tags'

function viewsLabel(count) {
  return count === 1 ? '1 leitura' : `${count} leituras`
}

function Block({ block }) {
  switch (block.type) {
    case 'h2':
      return <h2>{block.text}</h2>
    case 'quote':
      return <blockquote>{block.text}</blockquote>
    case 'code':
      return (
        <pre>
          <code>{block.text}</code>
        </pre>
      )
    default:
      return <p>{block.text}</p>
  }
}

export default function PostPage() {
  const { slug } = useParams()
  const { posts, loading } = usePosts()
  const post = findPost(posts, slug)
  const ordered = sortPosts(posts)
  const index = post ? ordered.findIndex((p) => p.slug === post.slug) : -1
  const newerPost = index > 0 ? ordered[index - 1] : null
  const olderPost = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null

  const [viewCount, setViewCount] = useState(post ? post.viewCount : 0)
  const countedSlug = useRef(null)

  useEffect(() => {
    if (!post) return
    setDocumentMeta({ title: post.title, description: post.excerpt, path: `/posts/${post.slug}`, type: 'article' })
    setPostJsonLd(post)
    return clearPostJsonLd
  }, [post])

  useEffect(() => {
    if (!post) return
    setViewCount(post.viewCount)
    if (countedSlug.current === post.slug) return
    countedSlug.current = post.slug
    fetch(`/api/posts/${post.slug}/view`, { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setViewCount(data.viewCount)
      })
      .catch(() => {})
  }, [post])

  if (loading) return <p className="search-status">carregando…</p>
  if (!post) return <Navigate to="/404" replace />

  return (
    <div className="post-shell">
      <div className="post-card">
        <div className="post-card__band">
          <div className="post-card__meta">
            <PulseSignature slug={post.slug} size="lg" />
            <span>
              {postDateTimeLabel(post)} · <strong>{post.readTime} min de leitura</strong> ·{' '}
              {viewsLabel(viewCount)}
            </span>
          </div>
        </div>
        <div className="post-card__body">
          <Link to="/" className="back-link">
            ← todos os pulsos
          </Link>
          <h1>{post.title}</h1>
          <ul className="tag-list post-card__tags">
            {post.tags.map((tag) => (
              <li className="tag-pill" key={tag}>
                <Link to={`/tags/${slugifyTag(tag)}`}>{tag}</Link>
              </li>
            ))}
          </ul>
          <div className="prose">
            {post.blocks.map((block, i) => (
              <Block block={block} key={i} />
            ))}
          </div>
          {(olderPost || newerPost) && (
            <nav className="post-nav" aria-label="Navegação entre pulsos">
              {olderPost ? (
                <Link to={`/posts/${olderPost.slug}`} className="post-nav__link post-nav__link--prev">
                  <span className="post-nav__label">← pulso anterior</span>
                  <span className="post-nav__title">{olderPost.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {newerPost && (
                <Link to={`/posts/${newerPost.slug}`} className="post-nav__link post-nav__link--next">
                  <span className="post-nav__label">próximo pulso →</span>
                  <span className="post-nav__title">{newerPost.title}</span>
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
