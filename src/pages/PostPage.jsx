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

const REACTION_EMOJIS = ['👍', '💡', '🔥', '❤️']

function reactedStorageKey(slug) {
  return `pulso-reacted-${slug}`
}

function loadReacted(slug) {
  try {
    return JSON.parse(localStorage.getItem(reactedStorageKey(slug)) || '[]')
  } catch {
    return []
  }
}

function relatedPosts(allPosts, post) {
  if (!post) return []
  return allPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ post: p, shared: p.tags.filter((t) => post.tags.includes(t)).length }))
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.shared - a.shared || (a.post.date < b.post.date ? 1 : -1))
    .slice(0, 3)
    .map((entry) => entry.post)
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

  const [reactions, setReactions] = useState({})
  const [reacted, setReacted] = useState([])

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

  useEffect(() => {
    if (!post) return
    setReacted(loadReacted(post.slug))
    fetch(`/api/posts/${post.slug}/reactions`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setReactions(data)
      })
      .catch(() => {})
  }, [post])

  function handleReact(emoji) {
    if (!post || reacted.includes(emoji)) return
    const nextReacted = [...reacted, emoji]
    setReacted(nextReacted)
    localStorage.setItem(reactedStorageKey(post.slug), JSON.stringify(nextReacted))
    setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }))
    fetch(`/api/posts/${post.slug}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setReactions((prev) => ({ ...prev, [data.emoji]: data.count }))
      })
      .catch(() => {})
  }

  if (loading) return <p className="search-status">carregando…</p>
  if (!post) return <Navigate to="/404" replace />

  const related = relatedPosts(posts, post)

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
          <div className="reactions" role="group" aria-label="Reagir a este pulso">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`reaction-btn${reacted.includes(emoji) ? ' reaction-btn--active' : ''}`}
                onClick={() => handleReact(emoji)}
                disabled={reacted.includes(emoji)}
                aria-pressed={reacted.includes(emoji)}
              >
                <span className="reaction-btn__emoji">{emoji}</span>
                <span className="reaction-btn__count">{reactions[emoji] || 0}</span>
              </button>
            ))}
          </div>
          {related.length > 0 && (
            <div className="related-posts">
              <p className="related-posts__label">pulsos relacionados</p>
              <ul className="related-posts__list">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link to={`/posts/${r.slug}`} className="related-posts__link">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
