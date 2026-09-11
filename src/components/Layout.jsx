import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { nextPulseLabel } from '../lib/schedule'
import BugReportWidget from './BugReportWidget'

export default function Layout() {
  const [countdown, setCountdown] = useState(() => nextPulseLabel())
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const id = setInterval(() => setCountdown(nextPulseLabel()), 30_000)
    return () => clearInterval(id)
  }, [])

  // Atalho global "/" pra busca (padrão de sites como GitHub/Slack) — sem
  // caixa de busca no header, só um link, então sem isso alcançar a busca
  // sempre exige clique + navegação. Ignora quando o foco já está em campo
  // editável, pra não roubar "/" de quem está digitando em outro lugar.
  useEffect(() => {
    function handleKeydown(e) {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      e.preventDefault()
      if (location.pathname === '/busca') {
        document.querySelector('.search-form__input')?.focus()
      } else {
        navigate('/busca')
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [navigate, location.pathname])

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
          <NavLink to="/busca" className="header__nav-link">
            buscar <kbd className="kbd-hint" aria-hidden="true">/</kbd>
          </NavLink>
          <NavLink to="/tags" className="header__nav-link">
            tags
          </NavLink>
          <NavLink to="/salvos" className="header__nav-link">
            salvos
          </NavLink>
          <NavLink to="/bastidores" className="header__nav-link">
            bastidores
          </NavLink>
          <NavLink to="/laboratorio" className="header__nav-link">
            laboratório
          </NavLink>
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
