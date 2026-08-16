import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePosts, sortPosts } from '../content/posts'
import { dayLabel } from '../lib/format'
import { setDocumentMeta, setRobotsNoIndex, clearRobotsNoIndex } from '../lib/seo'
import { slugifyTag } from '../lib/tags'
import { getSavedSlugs } from '../lib/saved'

export default function SavedPage() {
  const { posts, loading } = usePosts()
  const [savedSlugs, setSavedSlugs] = useState([])

  useEffect(() => {
    setDocumentMeta({ title: 'Salvos', path: '/salvos' })
    setRobotsNoIndex()
    return clearRobotsNoIndex
  }, [])

  // Lido a cada montagem — cobre voltar pra essa página depois de salvar um
  // post em outra aba/rota, sem precisar de um listener de storage global
  // pra uma lista que só o próprio visitante altera nessa mesma sessão.
  useEffect(() => {
    setSavedSlugs(getSavedSlugs())
  }, [])

  const saved = sortPosts(posts.filter((p) => savedSlugs.includes(p.slug)))

  return (
    <section className="feed">
      <div className="intro">
        <p className="intro__eyebrow">salvos</p>
        <h1>Pulsos guardados pra depois.</h1>
        <p>Ficam só no seu navegador — ninguém mais vê essa lista.</p>
      </div>

      {loading && <p className="search-status">carregando…</p>}
      {!loading && saved.length === 0 && (
        <p className="search-status">
          nenhum pulso salvo ainda — clique em "salvar" na página de um pulso pra guardar aqui.
        </p>
      )}

      <div className="day-group">
        {saved.map((post) => (
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
  )
}
