import { Link } from 'react-router-dom'

export default function NotFoundPage() {
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
