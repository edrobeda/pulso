import { useState } from 'react'

// Botão discreto no rodapé — visitante reporta um problema sem sair da
// página. Pedido do Edson, ver NECESSIDADES.md 2026-08-16.
export default function BugReportWidget() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setError('')
    fetch('/api/bug-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        website: honeypot,
        urlPagina: window.location.pathname,
      }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null)
        if (!r.ok) throw new Error(data?.error || 'não foi possível enviar o report')
        return data
      })
      .then(() => {
        setMessage('')
        setStatus('sent')
      })
      .catch((err) => {
        setError(err.message)
        setStatus('idle')
      })
  }

  return (
    <div className="bug-report">
      <button
        type="button"
        className="bug-report__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        reportar problema
      </button>
      {open && (
        <div className="bug-report__panel">
          {status === 'sent' ? (
            <p className="bug-report__thanks">valeu — recebemos o report.</p>
          ) : (
            <form className="bug-report__form" onSubmit={handleSubmit}>
              <input
                type="text"
                name="website"
                className="bug-report__honeypot"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
              <textarea
                className="bug-report__body"
                placeholder="o que deu errado?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={2000}
                rows={3}
                required
                aria-label="Descreva o problema"
              />
              {error && <p className="bug-report__error">{error}</p>}
              <button type="submit" className="bug-report__submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'enviando…' : 'enviar'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
