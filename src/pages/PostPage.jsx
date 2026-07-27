import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { findPost } from '../content/posts'
import { postDateTimeLabel } from '../lib/format'
import PulseSignature from '../components/PulseSignature'
import { setDocumentMeta, setPostJsonLd, clearPostJsonLd } from '../lib/seo'

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
  const post = findPost(slug)

  useEffect(() => {
    if (!post) return
    setDocumentMeta({ title: post.title, description: post.excerpt, path: `/posts/${post.slug}`, type: 'article' })
    setPostJsonLd(post)
    return clearPostJsonLd
  }, [post])

  if (!post) return <Navigate to="/404" replace />

  return (
    <div className="post-shell">
      <div className="post-card">
        <div className="post-card__band">
          <div className="post-card__meta">
            <PulseSignature slug={post.slug} size="lg" />
            <span>
              {postDateTimeLabel(post)} · <strong>{post.readTime} min de leitura</strong>
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
                {tag}
              </li>
            ))}
          </ul>
          <div className="prose">
            {post.blocks.map((block, i) => (
              <Block block={block} key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
