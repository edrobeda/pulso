import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setDocumentMeta, setRobotsNoIndex, clearRobotsNoIndex } from '../lib/seo'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  useEffect(() => {
    setDocumentMeta({ title: 'Página não encontrada', path: '/404' })
    setRobotsNoIndex()
    return clearRobotsNoIndex
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/busca?q=${encodeURIComponent(trimmed)}` : '/busca')
  }

  return (
    <div className="not-found">
      <h1>Sinal perdido.</h1>
      <p>Não existe nenhuma transmissão nesse endereço.</p>
      <form className="search-form" onSubmit={handleSubmit} role="search">
        <input
          type="search"
          className="search-form__input"
          placeholder="tentar buscar por título, tag ou palavra"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar pulsos"
          autoFocus
        />
        <button type="submit" className="search-form__submit">
          buscar
        </button>
      </form>
      <p>
        <Link to="/" className="back-link">
          ← voltar pro feed
        </Link>{' '}
        · <Link to="/tags">ver todas as tags</Link>
      </p>
    </div>
  )
}
