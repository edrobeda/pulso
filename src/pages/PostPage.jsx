import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { usePosts, usePostBody, findPost, sortPosts } from '../content/posts'
import { postDateTimeLabel, commentDateLabel } from '../lib/format'
import PulseSignature from '../components/PulseSignature'
import {
  setDocumentMeta,
  setPostJsonLd,
  clearPostJsonLd,
  setBreadcrumbJsonLd,
  clearBreadcrumbJsonLd,
  SITE_URL,
} from '../lib/seo'
import { slugifyTag } from '../lib/tags'
import { isSaved, toggleSaved } from '../lib/saved'
import { getClientToken } from '../lib/clientToken'

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

const FLAGGED_KEY = 'pulso-flagged-comments'

function loadFlagged() {
  try {
    return JSON.parse(localStorage.getItem(FLAGGED_KEY) || '[]')
  } catch {
    return []
  }
}

function saveFlagged(ids) {
  localStorage.setItem(FLAGGED_KEY, JSON.stringify(ids))
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

// Ids de seção pro sumário (Table of Contents) — mesmo slugify de tags,
// serve bem pra texto livre também. Sufixo de índice evita colisão entre
// dois h2 com o mesmo texto no mesmo post.
function headingId(text, index) {
  return `s-${slugifyTag(text)}-${index}`
}

function CodeBlock({ text }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {})
  }

  return (
    <div className="code-block">
      <button type="button" className="code-block__copy" onClick={handleCopy}>
        {copied ? '✓ copiado' : 'copiar'}
      </button>
      <pre>
        <code>{text}</code>
      </pre>
    </div>
  )
}

function Block({ block, headingIndex }) {
  switch (block.type) {
    case 'h2':
      return <h2 id={headingId(block.text, headingIndex)}>{block.text}</h2>
    case 'quote':
      return <blockquote>{block.text}</blockquote>
    case 'code':
      return <CodeBlock text={block.text} />
    default:
      return <p>{block.text}</p>
  }
}

export default function PostPage() {
  const { slug } = useParams()
  const { posts, loading } = usePosts()
  const post = findPost(posts, slug)
  const { post: postBody } = usePostBody(post ? slug : null)
  const ordered = sortPosts(posts)
  const index = post ? ordered.findIndex((p) => p.slug === post.slug) : -1
  const newerPost = index > 0 ? ordered[index - 1] : null
  const olderPost = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null

  const [viewCount, setViewCount] = useState(post ? post.viewCount : 0)
  const countedSlug = useRef(null)

  const [reactions, setReactions] = useState({})
  const [reacted, setReacted] = useState([])
  const [saved, setSaved] = useState(false)

  const [comments, setComments] = useState([])
  const [commentName, setCommentName] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [commentHoneypot, setCommentHoneypot] = useState('')
  const [commentStatus, setCommentStatus] = useState('idle')
  const [commentError, setCommentError] = useState('')
  const [flaggedIds, setFlaggedIds] = useState(loadFlagged)

  const [autoScroll, setAutoScroll] = useState(false)
  const [reducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const [readProgress, setReadProgress] = useState(0)
  const [copyState, setCopyState] = useState('idle')

  useEffect(() => {
    if (!post) return
    function updateProgress() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setReadProgress(scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0)
    }
    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [post])

  useEffect(() => {
    if (!post) return
    setDocumentMeta({ title: post.title, description: post.excerpt, path: `/posts/${post.slug}`, type: 'article' })
    const wordCount = postBody
      ? postBody.blocks.reduce((sum, b) => sum + (b.text ? b.text.trim().split(/\s+/).filter(Boolean).length : 0), 0)
      : undefined
    setPostJsonLd(post, wordCount)
    setBreadcrumbJsonLd(post)
    return () => {
      clearPostJsonLd()
      clearBreadcrumbJsonLd()
    }
  }, [post, postBody])

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
    setSaved(isSaved(post.slug))
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

  useEffect(() => {
    if (!post) return
    fetch(`/api/posts/${post.slug}/comments`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setComments(data)
      })
      .catch(() => {})
  }, [post])

  // Desliga sozinho quando a pessoa troca de post (índice reseta o scroll pro topo).
  useEffect(() => {
    setAutoScroll(false)
  }, [post?.slug])

  useEffect(() => {
    if (!autoScroll) return

    const PX_PER_FRAME = 0.4 // ritmo de leitura confortável, não uma rolagem rápida
    let raf

    function tick() {
      window.scrollBy(0, PX_PER_FRAME)
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom) {
        setAutoScroll(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // Qualquer gesto manual (roda do mouse, toque, arrastar barra, seta/espaço do teclado) pausa.
    function pauseOnManualInput() {
      setAutoScroll(false)
    }
    window.addEventListener('wheel', pauseOnManualInput, { passive: true })
    window.addEventListener('touchstart', pauseOnManualInput, { passive: true })
    window.addEventListener('mousedown', pauseOnManualInput, { passive: true })
    window.addEventListener('keydown', pauseOnManualInput)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', pauseOnManualInput)
      window.removeEventListener('touchstart', pauseOnManualInput)
      window.removeEventListener('mousedown', pauseOnManualInput)
      window.removeEventListener('keydown', pauseOnManualInput)
    }
  }, [autoScroll])

  function handleCommentSubmit(e) {
    e.preventDefault()
    if (!post || commentStatus === 'sending') return
    setCommentStatus('sending')
    setCommentError('')
    fetch(`/api/posts/${post.slug}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName: commentName, body: commentBody, website: commentHoneypot }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null)
        if (!r.ok) throw new Error(data?.error || 'não foi possível publicar o comentário')
        return data
      })
      .then((data) => {
        setComments((prev) => [...prev, data])
        setCommentBody('')
        setCommentName('')
        setCommentStatus('idle')
      })
      .catch((err) => {
        setCommentError(err.message)
        setCommentStatus('idle')
      })
  }

  function handleFlagComment(commentId) {
    if (flaggedIds.includes(commentId)) return
    const next = [...flaggedIds, commentId]
    setFlaggedIds(next)
    saveFlagged(next)
    fetch(`/api/comments/${commentId}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientToken: getClientToken() }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.hidden) {
          setComments((prev) => prev.filter((c) => c.id !== commentId))
        }
      })
      .catch(() => {})
  }

  function handleToggleSaved() {
    if (!post) return
    const next = toggleSaved(post.slug)
    setSaved(next.includes(post.slug))
  }

  function handleCopyLink() {
    if (!post) return
    const url = `${SITE_URL}/posts/${post.slug}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopyState('copied')
        setTimeout(() => setCopyState('idle'), 2000)
      })
      .catch(() => {})
  }

  function handleNativeShare() {
    if (!post || !navigator.share) return
    navigator
      .share({ title: post.title, text: post.excerpt, url: `${SITE_URL}/posts/${post.slug}` })
      .catch(() => {})
  }

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
  const toc = postBody
    ? postBody.blocks
        .map((block, i) => (block.type === 'h2' ? { id: headingId(block.text, i), text: block.text } : null))
        .filter(Boolean)
    : []

  return (
    <div className="post-shell">
      <div className="read-progress" aria-hidden="true">
        <div className="read-progress__bar" style={{ width: `${readProgress}%` }} />
      </div>
      {reducedMotion ? null : autoScroll ? (
        <button
          type="button"
          className="autoscroll-btn autoscroll-btn--active"
          onClick={() => setAutoScroll(false)}
          aria-pressed="true"
        >
          ❚❚ <span>pausar leitura automática</span>
        </button>
      ) : (
        <button
          type="button"
          className="autoscroll-btn"
          onClick={() => setAutoScroll(true)}
          aria-pressed="false"
        >
          ▶ <span>leitura automática</span>
        </button>
      )}
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
          {toc.length >= 3 && (
            <nav className="toc" aria-label="Sumário do pulso">
              <p className="toc__label">nesse pulso</p>
              <ol className="toc__list">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}>{item.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="prose">
            {postBody ? (
              postBody.blocks.map((block, i) => <Block block={block} headingIndex={i} key={i} />)
            ) : (
              <p className="search-status">carregando pulso…</p>
            )}
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
          <div className="share" role="group" aria-label="Compartilhar este pulso">
            <p className="share__label">compartilhar</p>
            <div className="share__buttons">
              <button
                type="button"
                className={`share-btn${saved ? ' share-btn--active' : ''}`}
                onClick={handleToggleSaved}
                aria-pressed={saved}
              >
                {saved ? '✓ salvo' : '🔖 salvar pra depois'}
              </button>
              <button type="button" className="share-btn" onClick={handleCopyLink}>
                {copyState === 'copied' ? '✓ link copiado' : '🔗 copiar link'}
              </button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button type="button" className="share-btn" onClick={handleNativeShare}>
                  📤 compartilhar
                </button>
              )}
              <a
                className="share-btn"
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} — ${SITE_URL}/posts/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <a
                className="share-btn"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`${SITE_URL}/posts/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                X
              </a>
            </div>
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
          <div className="comments">
            <p className="comments__label">
              {comments.length === 0 ? 'comentários' : `comentários (${comments.length})`}
            </p>
            {comments.length > 0 && (
              <ul className="comments__list">
                {comments.map((c) => (
                  <li className="comment" key={c.id}>
                    <div className="comment__meta">
                      <strong>{c.author_name}</strong>
                      <span>{commentDateLabel(c.created_at)}</span>
                      <button
                        type="button"
                        className="comment__flag"
                        onClick={() => handleFlagComment(c.id)}
                        disabled={flaggedIds.includes(c.id)}
                        aria-label="Sinalizar este comentário como spam ou problema"
                      >
                        {flaggedIds.includes(c.id) ? 'sinalizado' : 'sinalizar'}
                      </button>
                    </div>
                    <p className="comment__body">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <input
                type="text"
                className="comment-form__name"
                placeholder="nome (opcional)"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                maxLength={60}
                aria-label="Seu nome"
              />
              <input
                type="text"
                name="website"
                className="comment-form__honeypot"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={commentHoneypot}
                onChange={(e) => setCommentHoneypot(e.target.value)}
              />
              <textarea
                className="comment-form__body"
                placeholder="deixe um comentário"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                maxLength={1000}
                rows={3}
                required
                aria-label="Seu comentário"
              />
              {commentError && <p className="comment-form__error">{commentError}</p>}
              <button type="submit" className="comment-form__submit" disabled={commentStatus === 'sending'}>
                {commentStatus === 'sending' ? 'enviando…' : 'comentar'}
              </button>
            </form>
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
