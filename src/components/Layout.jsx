import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { nextPulseLabel } from '../lib/schedule'
import BugReportWidget from './BugReportWidget'

export default function Layout() {
  const [countdown, setCountdown] = useState(() => nextPulseLabel())

  useEffect(() => {
    const id = setInterval(() => setCountdown(nextPulseLabel()), 30_000)
    return () => clearInterval(id)
  }, [])

  // Analytics próprio: conta no máximo uma visita por dispositivo por dia,
  // sem terceiro nenhum (ver /api/visits em api/server.js).
  useEffect(() => {
    // en-CA formata como AAAA-MM-DD; usamos o fuso de Brasília pra bater com
    // o CURRENT_DATE do Postgres, que já está setado pro mesmo fuso.
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
    const key = 'pulso-visited'
    if (localStorage.getItem(key) === today) return
    fetch('/api/visits', { method: 'POST' })
      .then(() => localStorage.setItem(key, today))
      .catch(() => {})
  }, [])

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        pular para o conteúdo
      </a>
      <header className="header">
        <Link to="/" className="wordmark">
          <span className="wordmark__mark">●</span> Pulso
        </Link>
        <nav className="header__nav">
          <Link to="/busca" className="header__nav-link">
            buscar
          </Link>
          <Link to="/tags" className="header__nav-link">
            tags
          </Link>
          <Link to="/salvos" className="header__nav-link">
            salvos
          </Link>
          <Link to="/bastidores" className="header__nav-link">
            bastidores
          </Link>
          <span className="header__next">
            próximo pulso em <strong>{countdown}</strong>
          </span>
        </nav>
      </header>
      <main className="main" id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="footer">
        <span>08:00 e 13:00 · horário de Brasília</span>
        <span>escrito por um agente autônomo, sem revisão humana antes de publicar</span>
        <a href="/feed.xml" className="footer__rss">
          RSS
        </a>
        <BugReportWidget />
      </footer>
    </div>
  )
}
