# Checklist: hooks do React e efeitos que resetam sozinhos

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## Dois bugs recorrentes, duas causas diferentes

### 1. Hook chamado depois de um `return` condicional

React exige que todo hook (`useState`, `useEffect`, `useMemo`...) seja
chamado **sempre na mesma ordem, em toda renderização** — inclusive quando o
componente decide não renderizar nada.

```jsx
// ERRADO — se `loading` for true na 1ª render e false depois,
// a ordem dos hooks muda entre renders e o React quebra silenciosamente
// (ou lança "Rendered more hooks than during the previous render")
function Componente({ loading }) {
  if (loading) return <Spinner />
  const [valor, setValor] = useState(0) // hook depois do return
  useEffect(() => { ... }, [])
  return <div>{valor}</div>
}
```

```jsx
// CERTO — todo hook antes de qualquer return condicional
function Componente({ loading }) {
  const [valor, setValor] = useState(0)
  useEffect(() => { ... }, [])
  if (loading) return <Spinner />
  return <div>{valor}</div>
}
```

**Sintoma comum**: funciona na maior parte do tempo, quebra só em
combinações específicas de estado — bug silencioso, difícil de reproduzir
sem saber a causa.

### 2. Array/objeto recriado a cada render reseta um efeito por referência

```jsx
// ERRADO — `phrases` é um array NOVO a cada render (mesmo conteúdo,
// referência diferente). Um useEffect que depende dele dispara de novo
// toda vez que o componente re-renderiza — inclusive por causa do
// próprio efeito (ex.: uma animação de digitação que causa re-render
// a cada caractere, resetando a si mesma em loop).
function Componente({ textoBase }) {
  const phrases = textoBase.split(',') // nova referência sempre
  useEffect(() => {
    resetarAnimacao(phrases)
  }, [phrases])
  ...
}
```

```jsx
// CERTO — memoiza pela dependência primitiva real (a string),
// não pelo array derivado dela
function Componente({ textoBase }) {
  const phrases = useMemo(() => textoBase.split(','), [textoBase])
  useEffect(() => {
    resetarAnimacao(phrases)
  }, [phrases])
  ...
}
```

## Checklist rápido antes de dar merge

- [ ] Todo `useState`/`useEffect`/`useMemo`/`useCallback` vem **antes** de
      qualquer `if (...) return`?
- [ ] Todo array/objeto/função passado como dependência de `useEffect` é
      **memoizado** (`useMemo`/`useCallback`) ou é um valor primitivo?
- [ ] Rodou o lint do React Hooks (`eslint-plugin-react-hooks`,
      regra `exhaustive-deps`) sem suprimir avisos sem entender por quê?
- [ ] Testou a interação de verdade no browser (não só o build passar) —
      esse tipo de bug frequentemente não aparece em testes unitários
      simples, só na interação real.
