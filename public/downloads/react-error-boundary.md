# Error boundary em duas camadas pra React não virar tela branca

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Um erro lançado durante o render (dado malformado vindo de conteúdo
dinâmico, um componente com bug, uma prop no formato errado) não fica
contido no componente que falhou — por padrão o React descarta a árvore
inteira a partir da raiz montada, e a página vira branca pro visitante. Sem
nada capturando isso: nenhum log fica registrado (nem no servidor, nem
necessariamente no console do visitante de forma visível), e a única forma
de continuar navegando é um F5 manual, que também não é óbvio pra quem só
vê uma tela branca sem nenhuma mensagem.

Um `try/catch` comum não resolve — erros de render em React não propagam
como exceção síncrona pro código que chamou o componente. A única forma de
capturar isso é um **error boundary**: um componente de classe que
implementa `getDerivedStateFromError` (troca o que é renderizado) e
`componentDidCatch` (efeito colateral, ex. logar).

## O componente (`ErrorBoundary.jsx`)

```jsx
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Troque por um log real (endpoint próprio, serviço de observability) —
    // console.error sozinho só ajuda quem abrir o devtools no momento certo.
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  componentDidUpdate(prevProps) {
    // Permite que o boundary se "cure" sozinho quando o contexto muda
    // (ex. troca de rota) sem exigir reload manual da página inteira.
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
    <div>
      <h1>Algo quebrou ao carregar esta página.</h1>
      <p>Tente recarregar ou voltar.</p>
    </div>
  )
}
```

Hooks (`useState`/`useEffect`) não têm equivalente de error boundary —
`getDerivedStateFromError`/`componentDidCatch` só existem em componente de
classe. Não tem problema usar essa única classe isolada num app que é todo
funcional/hooks no resto — não precisa "hookizar" o resto do app por causa
dela.

## Por que duas camadas, não uma só

Uma única boundary na raiz do app captura tudo, mas qualquer erro em
qualquer página derruba a aplicação inteira até o próximo reload manual —
inclusive header, navegação, rodapé. Duas camadas resolvem duas coisas
diferentes:

1. **Boundary em volta do conteúdo roteado** (dentro do layout
   compartilhado, em volta de `<Outlet />` ou equivalente), com
   `resetKey` amarrado ao path da rota atual. Se uma página quebra, o
   usuário ainda vê header/navegação/rodapé normalmente, e ao clicar em
   outro link a boundary se reseta sozinha — sem precisar de F5.
2. **Boundary na raiz** (em volta do componente de app inteiro, no ponto de
   montagem), como última linha de defesa — se algo quebrar fora do
   conteúdo roteado (o próprio layout, um provider), ainda existe uma tela
   de fallback em vez de branco puro sem nenhuma mensagem.

```jsx
// ponto de montagem (ex. main.jsx)
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)

// dentro do layout compartilhado
<main>
  <ErrorBoundary resetKey={location.pathname}>
    <Outlet />
  </ErrorBoundary>
</main>
```

## Checklist

- [ ] Existe pelo menos uma boundary entre a raiz montada e o conteúdo que
      varia por página/rota — não só uma cobrindo o app inteiro sem reset.
- [ ] A boundary do conteúdo roteado se reseta sozinha ao trocar de rota
      (`resetKey` amarrado a algo que muda por navegação), sem exigir reload
      manual pra sair de um estado quebrado.
- [ ] `componentDidCatch` loga de verdade (não fica em silêncio) — ideal
      mandar pro mesmo lugar que já recebe erro do backend, não só
      `console.error` que só quem tem devtools aberto no momento vê.
- [ ] O fallback visual é consistente com a identidade do resto do site
      (não uma tela de erro genérica do framework) e tem um jeito claro de
      sair dali (link pra home, por exemplo) — evita virar um beco sem
      saída pro visitante.
- [ ] Teste de verdade: force um erro de render (ex. componente que lança
      exceção condicionalmente via prop de debug) e confirme visualmente
      que a boundary certa pega, não a raiz inteira, e que navegar pra
      outra página depois disso funciona sem F5.
