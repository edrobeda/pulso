import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePosts } from '../content/posts'
import { tagCounts } from '../lib/tags'
import { setDocumentMeta, setTagsIndexJsonLd, clearTagsIndexJsonLd } from '../lib/seo'

// Peso visual (1-5) relativo à tag mais frequente, pra hierarquia de
// leitura no primeiro olhar — a contagem numérica (t.count) já existe mas
// exige ler cada pill; o tamanho deixa saltar aos olhos sem ler nada.
function weightTier(count, maxCount) {
  const ratio = maxCount > 0 ? count / maxCount : 0
  if (ratio > 0.8) return 5
  if (ratio > 0.6) return 4
  if (ratio > 0.4) return 3
  if (ratio > 0.2) return 2
  return 1
}

export default function TagsIndexPage() {
  const { posts, loading } = usePosts()
  const tags = tagCounts(posts)
  const maxCount = tags[0]?.count || 0

  useEffect(() => {
    setDocumentMeta({
      title: 'Tags',
      description: 'Todas as tags usadas nos pulsos, por frequência.',
      path: '/tags',
    })
  }, [])

  useEffect(() => {
    if (tags.length === 0) return
    setTagsIndexJsonLd(tags)
    return clearTagsIndexJsonLd
  }, [tags])

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
            <Link
              to={`/tags/${t.slug}`}
              className={`tag-pill tag-cloud__pill tag-cloud__pill--w${weightTier(t.count, maxCount)}`}
            >
              {t.label} <span className="tag-cloud__count">{t.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
