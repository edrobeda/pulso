# Numa SPA, trocar de página herda a posição de scroll da página anterior

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Numa navegação de página tradicional (link `<a href>` com reload completo),
o navegador reseta o scroll pro topo sozinho — é comportamento nativo,
ninguém precisa pedir. Numa SPA com roteador client-side (React Router,
Vue Router, qualquer coisa que troque o DOM sem reload), isso deixa de ser
automático: o roteador troca o conteúdo da página, mas a posição de scroll
do documento não muda sozinha. Ela só segue "sendo a que já estava".

O lugar onde isso dói de verdade é em qualquer navegação sequencial de
conteúdo longo — "próximo"/"anterior" no fim de um artigo, um link pro
próximo item de uma lista. Quem lê até o fim de uma página e clica para
seguir cai, na página nova, exatamente na mesma altura de scroll (em pixels)
em que estava — ou seja, no meio do conteúdo da página seguinte, não no
título dela. Nada quebra, não existe erro nenhum: a página carrega certa,
só que a primeira coisa que a pessoa vê ao trocar de conteúdo é um trecho
do meio, sem contexto, parecendo que o link levou pro lugar errado.

## Por que não é só "jogar `window.scrollTo(0, 0)` em todo lugar"

A solução óbvia de resetar scroll manualmente a cada navegação esconde uma
armadilha: navegação de **voltar/avançar** pelo histórico do navegador
(botão voltar, gesto de voltar no mobile) tem a expectativa contrária —
quem volta pra uma lista depois de ler um item espera retornar pra onde
estava rolado, não pro topo da lista de novo. Resetar sempre pro topo
resolve o problema original e cria um novo: perder a posição ao voltar.

O comportamento certo distingue os dois casos:

- **Navegação nova** (push — clicou num link, trocou de rota pra algo que
  não estava no histórico): resetar pro topo.
- **Navegação de histórico** (pop — voltar/avançar): restaurar a posição de
  scroll salva de quando saiu daquela entrada.

## Com React Router (v6.4+)

O próprio roteador já resolve os dois casos com um componente pronto,
desde que o app use um dos roteadores baseados em `createBrowserRouter`
(ou `RouterProvider`) — funciona de forma transparente sem precisar
rastrear nada manualmente:

```jsx
import { ScrollRestoration, Outlet } from 'react-router-dom'

function Layout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}
```

Um detalhe que custa descobrir sem ler a documentação: `ScrollRestoration`
exige que a navegação aconteça via `<Link>`/`useNavigate` do próprio
roteador — ele depende de interceptar essas transições para saber se é
push ou pop. Um `location.href = ...` ou um `<a href>` puro continuam
disparando reload nativo (o navegador já reseta sozinho nesse caso), mas
não passam pela lógica de restauração do roteador.

## Sem React Router (ou versão mais antiga baseada em `<BrowserRouter>` simples)

Quando o roteador em uso não tem esse componente embutido, o padrão
manual é: guardar a posição de scroll por chave de rota num `Map` (em
memória ou `sessionStorage`, pra sobreviver a reload), salvar a posição
atual **antes** de navegar pra uma rota nova, e decidir resetar vs.
restaurar com base no tipo de navegação que o próprio histórico do
navegador expõe:

```js
const scrollPositions = new Map()

function saveScrollPosition(key) {
  scrollPositions.set(key, window.scrollY)
}

function onRouteChange(newKey, navigationType) {
  if (navigationType === 'POP') {
    const saved = scrollPositions.get(newKey)
    window.scrollTo(0, saved ?? 0)
  } else {
    window.scrollTo(0, 0)
  }
}
```

`navigationType` existe nativamente na Navigation API (`PerformanceNavigationTiming`)
e é exposto por praticamente todo roteador client-side (`history.action`
no history v5, `navigationType` no React Router, equivalente no Vue
Router) — não precisa reimplementar a detecção de push vs. pop do zero.

## Checklist

- [ ] Trocar de página por qualquer link interno (não só o menu principal —
      inclua paginação, "próximo"/"anterior", links dentro do próprio
      conteúdo) deixa a nova página visível a partir do topo, não da
      posição de scroll da página anterior.
- [ ] Voltar pelo histórico do navegador (botão voltar) restaura a posição
      de scroll de onde a pessoa estava antes de sair daquela página — não
      reseta pro topo também.
- [ ] O teste foi feito rolando até o fim de uma página de conteúdo longo
      antes de clicar pra seguir — rolar pouco ou nada mascara o bug,
      porque a diferença de posição fica pequena ou imperceptível.
- [ ] Se o app tem algum elemento com scroll interno próprio (um painel, um
      modal com conteúdo rolável) separado do scroll do documento, confirme
      se ele também precisa do mesmo tratamento — a solução do roteador
      geralmente só cobre o scroll da janela/documento.
