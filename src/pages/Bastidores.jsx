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
  laboratorio: 'laboratório · 20:00',
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

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024)
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  return `${mb.toFixed(1)} MB`
}

function dbSizeDayLabel(isoDate) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    .format(new Date(`${isoDate}T12:00:00`))
    .replace('.', '')
}

function bugReportDateLabel(isoTimestamp) {
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

export default function Bastidores() {
  const [state, setState] = useState({ status: 'loading', entries: [] })
  const [usage, setUsage] = useState({ status: 'loading', rows: [] })
  const [visits, setVisits] = useState({ status: 'loading', rows: [] })
  const [bugReports, setBugReports] = useState({ status: 'loading', rows: [] })
  const [comments, setComments] = useState({ status: 'loading', rows: [] })
  const [searchStats, setSearchStats] = useState({ status: 'loading', data: null })
  const [downloads, setDownloads] = useState({ status: 'loading', rows: [] })
  const [dbSize, setDbSize] = useState({ status: 'loading', rows: [] })

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

  useEffect(() => {
    let cancelled = false
    fetch('/api/bug-reports')
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json()
      })
      .then((rows) => {
        if (!cancelled) setBugReports({ status: 'ready', rows })
      })
      .catch(() => {
        if (!cancelled) setBugReports({ status: 'error', rows: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/comments/recent')
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json()
      })
      .then((rows) => {
        if (!cancelled) setComments({ status: 'ready', rows })
      })
      .catch(() => {
        if (!cancelled) setComments({ status: 'error', rows: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/search/top-queries')
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) setSearchStats({ status: 'ready', data })
      })
      .catch(() => {
        if (!cancelled) setSearchStats({ status: 'error', data: null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/downloads')
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json()
      })
      .then((rows) => {
        if (!cancelled) setDownloads({ status: 'ready', rows })
      })
      .catch(() => {
        if (!cancelled) setDownloads({ status: 'error', rows: [] })
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/db-size')
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json()
      })
      .then((rows) => {
        if (!cancelled) setDbSize({ status: 'ready', rows })
      })
      .catch(() => {
        if (!cancelled) setDbSize({ status: 'error', rows: [] })
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
        (visits.status === 'ready' && visits.rows.length > 0) ||
        (dbSize.status === 'ready' && dbSize.rows.length > 0)) && (
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

          {dbSize.status === 'ready' && dbSize.rows.length > 0 && (
            <div className="metric-card metric-card--dbsize">
              <p className="metric-card__label">
                <span className="metric-card__icon" aria-hidden="true">▦</span>
                tamanho do banco (auto-monitorado)
              </p>
              <ul className="usage-list">
                {dbSize.rows.map((r) => (
                  <li className="usage-item" key={r.entry_date}>
                    <span className="usage-item__agent">{dbSizeDayLabel(r.entry_date)}</span>
                    <span className="usage-item__tokens">{formatBytes(Number(r.size_bytes))}</span>
                  </li>
                ))}
              </ul>
              {dbSize.rows.length > 1 && (
                <p className="metric-card__footnote">
                  {formatBytes(Number(dbSize.rows[0].size_bytes) - Number(dbSize.rows[dbSize.rows.length - 1].size_bytes))}{' '}
                  de crescimento nos últimos {dbSize.rows.length} dias registrados
                </p>
              )}
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

      {bugReports.status === 'ready' && bugReports.rows.length > 0 && (
        <div className="bug-reports-section">
          <h2 className="section-heading">
            <span className="section-heading__icon" aria-hidden="true">⚑</span>
            reportados por leitores
          </h2>
          <ul className="bug-reports-list">
            {bugReports.rows.map((r) => (
              <li className="bug-reports-item" key={r.id}>
                <div className="bug-reports-item__head">
                  <span className="bug-reports-item__when">{bugReportDateLabel(r.created_at)}</span>
                  {r.url_pagina && <span className="bug-reports-item__url">{r.url_pagina}</span>}
                </div>
                <p className="bug-reports-item__message">{r.message}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {comments.status === 'ready' && comments.rows.length > 0 && (
        <div className="comments-recent-section">
          <h2 className="section-heading">
            <span className="section-heading__icon" aria-hidden="true">💬</span>
            comentários recentes (todos os posts)
          </h2>
          <ul className="bug-reports-list">
            {comments.rows.map((c) => (
              <li className="bug-reports-item" key={c.id}>
                <div className="bug-reports-item__head">
                  <span className="bug-reports-item__when">{bugReportDateLabel(c.created_at)}</span>
                  <span className="bug-reports-item__author">{c.author_name}</span>
                  <a href={`/posts/${c.slug}`} className="bug-reports-item__url">
                    {c.post_title}
                  </a>
                </div>
                <p className="bug-reports-item__message">{c.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {searchStats.status === 'ready' && searchStats.data && searchStats.data.totalSearches > 0 && (
        <div className="search-stats-section">
          <h2 className="section-heading">
            <span className="section-heading__icon" aria-hidden="true">⌕</span>
            o que os leitores buscam (últimos 30 dias)
          </h2>
          <p className="search-stats__summary">
            {searchStats.data.totalSearches.toLocaleString('pt-BR')} buscas ·{' '}
            {searchStats.data.zeroResultSearches.toLocaleString('pt-BR')} sem resultado
          </p>
          {searchStats.data.topQueries.length > 0 ? (
            <ul className="search-stats__list">
              {searchStats.data.topQueries.map((q) => (
                <li className="search-stats__item" key={q.query}>
                  <span className="search-stats__term">{q.query}</span>
                  <span className="search-stats__count">
                    {q.times}× {q.always_zero_result ? '· sem resultado' : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="search-stats__empty">
              nenhum termo se repetiu o suficiente pra aparecer aqui ainda (só mostramos termos
              buscados 3 vezes ou mais, pra não expor uma busca isolada de alguém).
            </p>
          )}
        </div>
      )}

      {downloads.status === 'ready' && downloads.rows.length > 0 && (
        <div className="downloads-stats-section">
          <h2 className="section-heading">
            <span className="section-heading__icon" aria-hidden="true">↓</span>
            downloads mais baixados (/laboratorio)
          </h2>
          <ul className="usage-list">
            {downloads.rows.map((d) => (
              <li className="usage-item" key={d.file}>
                <span className="usage-item__agent">{d.file}</span>
                <span className="usage-item__cost">
                  {d.count === 1 ? '1 download' : `${d.count} downloads`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
