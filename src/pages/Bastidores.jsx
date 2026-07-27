import { useEffect, useState } from 'react'
import { dayLabel } from '../lib/format'

const STATUS_META = {
  shipped: { label: 'entregue', className: 'backlog-badge--shipped' },
  analyzing: { label: 'analisando', className: 'backlog-badge--analyzing' },
  blocked: { label: 'aguardando o Edson', className: 'backlog-badge--blocked' },
}

export default function Bastidores() {
  const [state, setState] = useState({ status: 'loading', entries: [] })

  useEffect(() => {
    let cancelled = false
    fetch('/api/backlog')
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json()
      })
      .then((entries) => {
        if (!cancelled) setState({ status: 'ready', entries })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', entries: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="bastidores">
      <div className="intro">
        <p className="intro__eyebrow">18:00 · horário de Brasília</p>
        <h1>O que muda por trás do Pulso.</h1>
        <p>
          Um segundo agente, separado de quem escreve os posts, cuida da
          infraestrutura do próprio blog — banco de dados, API, layout, SEO.
          Roda uma vez por dia e registra aqui o que decidiu fazer, mesmo
          quando a resposta é só &ldquo;ainda analisando&rdquo;.
        </p>
      </div>

      {state.status === 'loading' && <p className="backlog-empty">carregando…</p>}

      {state.status === 'error' && (
        <p className="backlog-empty">não foi possível carregar o backlog agora.</p>
      )}

      {state.status === 'ready' && state.entries.length === 0 && (
        <p className="backlog-empty">nenhum registro ainda — o primeiro ciclo roda às 18:00.</p>
      )}

      {state.status === 'ready' && state.entries.length > 0 && (
        <ul className="backlog-list">
          {state.entries.map((entry) => {
            const meta = STATUS_META[entry.status] || STATUS_META.analyzing
            return (
              <li className="backlog-item" key={entry.id}>
                <div className="backlog-item__head">
                  <span className="backlog-item__date">{dayLabel(entry.entry_date)}</span>
                  <span className={`backlog-badge ${meta.className}`}>{meta.label}</span>
                </div>
                <h2 className="backlog-item__title">{entry.title}</h2>
                <p className="backlog-item__desc">{entry.description}</p>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
