# Stale-while-revalidate de lista com seed em localStorage

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Um service worker cacheando chamadas de API em modo network-first (tenta a
rede primeiro, só cai pro cache se a rede falhar) resolve bem o cenário
offline. Mesmo assim, toda abertura fria do app (aba nova, PWA reaberta)
continua mostrando um estado de carregamento antes da lista aparecer: o
componente nasce vazio e só se preenche depois que a chamada de rede
resolve — o service worker decide **o que** a requisição recebe como
resposta, não **quando** o componente decide renderizar. Nada está
quebrado; a rede geralmente responde rápido, mas cada abertura paga o
round-trip inteiro pra mostrar um dado que, na maioria das vezes, nem
mudou desde a última visita.

Cache de rede (service worker, HTTP cache) e cache de estado do app são
duas camadas independentes, e é fácil achar que resolver a primeira já
resolve a segunda.

## O padrão

1. Módulo de dados mantém três fontes, em ordem de prioridade: cache em
   memória da sessão atual → seed em `localStorage` (sobrevive entre
   sessões, com TTL) → rede.
2. O estado inicial do componente já nasce preenchido com o seed do
   `localStorage`, se existir — sem "carregando…" nesse caso.
3. A chamada de rede sempre dispara (mesmo com seed disponível), pra
   revalidar em segundo plano e manter os dois caches atualizados.
4. Se a revalidação falhar (offline, erro de servidor), mantenha o que já
   estava na tela — nunca esvazie a lista nem substitua por uma mensagem de
   erro só porque a *atualização* falhou; o dado antigo continua sendo
   melhor que nada.

## Template (JS puro, adaptável a qualquer framework)

```js
const STORAGE_KEY = 'app:lista-cache:v1'
const STORAGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // ajuste ao seu caso

let memoryCache = null
let inFlight = null

function readSeed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.savedAt !== 'number') return null
    if (Date.now() - parsed.savedAt > STORAGE_MAX_AGE_MS) return null
    return parsed.data
  } catch {
    return null // localStorage indisponível (modo privado) ou dado corrompido
  }
}

function writeSeed(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), data }))
  } catch {
    // quota cheia ou storage indisponível — cache em memória ainda cobre a sessão atual
  }
}

function fetchList() {
  if (memoryCache) return Promise.resolve(memoryCache)
  if (!inFlight) {
    inFlight = fetch('/api/lista')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        memoryCache = data
        writeSeed(data)
        return data
      })
      .catch((err) => {
        inFlight = null
        throw err
      })
  }
  return inFlight
}

// Exemplo de uso em React — adapte ao seu framework se não for React.
function useLista() {
  const [state, setState] = React.useState(() => {
    if (memoryCache) return { itens: memoryCache, carregando: false, erro: null }
    const seed = readSeed()
    return seed
      ? { itens: seed, carregando: false, erro: null }
      : { itens: [], carregando: true, erro: null }
  })

  React.useEffect(() => {
    if (memoryCache) return // já confirmado via rede nesta sessão, nada a revalidar
    let cancelado = false
    fetchList()
      .then((itens) => {
        if (!cancelado) setState({ itens, carregando: false, erro: null })
      })
      .catch((erro) => {
        if (cancelado) return
        // Falha de rede: mantém o seed velho na tela em vez de esvaziar.
        const seed = readSeed()
        setState(seed ? { itens: seed, carregando: false, erro: null } : { itens: [], carregando: false, erro })
      })
    return () => {
      cancelado = true
    }
  }, [])

  return state
}
```

## Checklist antes de considerar pronto

- [ ] O estado inicial do componente lê o seed de `localStorage` de forma
      **síncrona** (dentro do inicializador do estado, não num `useEffect`
      que só roda depois do primeiro render) — senão a primeira pintura
      ainda sai vazia.
- [ ] TTL definido pro seed (não mostrar dado absurdamente velho se o
      usuário voltar depois de meses offline) — mas generoso o bastante
      pra não descartar um seed ainda razoável só por estar há alguns dias.
- [ ] Leitura e escrita de `localStorage` envoltas em `try/catch` — modo
      privado do navegador, quota cheia ou storage desabilitado não podem
      quebrar o carregamento.
- [ ] Revalidação de rede sempre dispara, mesmo com seed disponível — o
      seed é só pra pintura inicial, não substitui a confirmação real.
- [ ] Falha na revalidação mantém o dado anterior na tela (seed ou cache em
      memória), não esvazia nem troca por mensagem de erro — só mostre erro
      se nunca existiu nenhum dado pra mostrar.
- [ ] Teste o cenário que interessa: abra o app já com um cache válido em
      `localStorage`, desligue a rede (DevTools → offline) e confirme que a
      lista aparece na hora mesmo assim, sem "carregando…".
