import { useEffect, useState } from 'react'
import { dayLabel } from '../lib/format'
import { setDocumentMeta } from '../lib/seo'

const STATUS_META = {
  shipped: { label: 'entregue', className: 'backlog-badge--shipped' },
  analyzing: { label: 'analisando', className: 'backlog-badge--analyzing' },
  blocked: { label: 'aguardando o Edson', className: 'backlog-badge--blocked' },
}

const AGENT_LABEL = {
  infra: 'infra · 18:00',
  publicacao: 'publicação · 08:00/13:00',
}

function usageRunLabel(isoTimestamp) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(new Date(isoTimestamp))
    .replace('.', '')
}

function usageTokensLabel(entry) {
  const total =
    Number(entry.input_tokens) +
    Number(entry.output_tokens) +
    Number(entry.cache_read_tokens) +
    Number(entry.cache_creation_tokens)
  return `${total.toLocaleString('pt-BR')} tokens`
}

function usageCostLabel(costUsd) {
  return `US$ ${Number(costUsd).toFixed(2)}`
}

function visitDayLabel(isoDate) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(new Date(`${isoDate}T12:00:00`))
    .replace('.', '')
}

export default function Bastidores() {
  const [state, setState] = useState({ status: 'loading', entries: [] })
  const [usage, setUsage] = useState({ status: 'loading', rows: [] })
  const [visits, setVisits] = useState({ status: 'loading', rows: [] })

  useEffect(() => {
    setDocumentMeta({
      title: 'Bastidores',
      description:
        'O que muda por trás do Pulso: banco de dados, API, layout e SEO, cuidados por um segundo agente autônomo que roda uma vez por dia.',
      path: '/bastidores',
    })
  }, [])

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

  useEffect(() => {
    let cancelled = false
    fetch('/api/usage')
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json()
      })
      .then((rows) => {
        if (!cancelled) setUsage({ status: 'ready', rows })
      })
      .catch(() => {
        if (!cancelled) setUsage({ status: 'error', rows: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/visits')
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json()
      })
      .then((rows) => {
        if (!cancelled) setVisits({ status: 'ready', rows })
      })
      .catch(() => {
        if (!cancelled) setVisits({ status: 'error', rows: [] })
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

      {((usage.status === 'ready' && usage.rows.length > 0) ||
        (visits.status === 'ready' && visits.rows.length > 0)) && (
        <div className="metrics-grid">
          {usage.status === 'ready' && usage.rows.length > 0 && (
            <div className="metric-card metric-card--cost">
              <p className="metric-card__label">
                <span className="metric-card__icon" aria-hidden="true">$</span>
                custo real por rodada
              </p>
              <ul className="usage-list">
                {usage.rows.map((entry, i) => (
                  <li className="usage-item" key={i}>
                    <span className="usage-item__agent">
                      {AGENT_LABEL[entry.agent] || entry.agent}
                    </span>
                    <span className="usage-item__when">{usageRunLabel(entry.run_at)}</span>
                    <span className="usage-item__tokens">{usageTokensLabel(entry)}</span>
                    <span className="usage-item__cost">{usageCostLabel(entry.cost_usd)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {visits.status === 'ready' && visits.rows.length > 0 && (
            <div className="metric-card metric-card--visits">
              <p className="metric-card__label">
                <span className="metric-card__icon" aria-hidden="true">↗</span>
                visitantes únicos por dia (analytics próprio, sem terceiros)
              </p>
              <ul className="usage-list">
                {visits.rows.map((v) => (
                  <li className="usage-item" key={v.date}>
                    <span className="usage-item__agent">{visitDayLabel(v.date)}</span>
                    <span className="usage-item__tokens">
                      {v.count === 1 ? '1 visitante' : `${v.count} visitantes`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="changelog-section">
        <h2 className="section-heading">
          <span className="section-heading__icon" aria-hidden="true">▤</span>
          histórico de mudanças
        </h2>

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
                  <h3 className="backlog-item__title">{entry.title}</h3>
                  <p className="backlog-item__desc">{entry.description}</p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
