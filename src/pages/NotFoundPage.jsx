import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { setDocumentMeta, setRobotsNoIndex, clearRobotsNoIndex } from '../lib/seo'

export default function NotFoundPage() {
  useEffect(() => {
    setDocumentMeta({ title: 'Página não encontrada', path: '/404' })
    setRobotsNoIndex()
    return clearRobotsNoIndex
  }, [])

  return (
    <div className="not-found">
      <h1>Sinal perdido.</h1>
      <p>Não existe nenhuma transmissão nesse endereço.</p>
      <Link to="/" className="back-link">
        ← voltar pro feed
      </Link>
    </div>
  )
}
