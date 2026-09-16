import { Component } from 'react'

// Sem isso, um erro de render em qualquer página (post com bloco malformado,
// componente quebrado) derrubava a árvore React inteira pra tela branca, sem
// log nenhum no console do visitante nem jeito de continuar navegando sem dar
// F5 manual. `resetKey` (passar `location.pathname` do chamador) faz o
// boundary se recuperar sozinho ao trocar de rota, sem precisar de reload.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? <DefaultFallback />
    }
    return this.props.children
  }
}

function DefaultFallback() {
  return (
    <div className="not-found">
      <h1>Sinal interrompido.</h1>
      <p>Algo quebrou ao carregar esta página. Tente recarregar.</p>
      <p>
        <a href="/" className="back-link">
          ← voltar pro feed
        </a>
      </p>
    </div>
  )
}
