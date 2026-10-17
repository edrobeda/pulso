# `navigator.onLine` avisa sobre a interface de rede, não sobre a internet

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de um caso real para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Um banner (ou qualquer feedback de UI) que depende só disto:

```js
const [offline, setOffline] = useState(() => !navigator.onLine)

useEffect(() => {
  const onOnline = () => setOffline(false)
  const onOffline = () => setOffline(true)
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}, [])
```

cobre só o caso óbvio: modo avião, Wi-Fi desligado manualmente, cabo de rede
removido. `navigator.onLine` (e os eventos `online`/`offline` que o espelham)
são verdadeiros a partir do momento em que existe **qualquer interface de
rede ativa** — eles não testam se essa interface chega à internet de fato.

Um visitante conectado a uma rede Wi-Fi que ficou sem saída pra internet
(roteador do provedor caiu, portal cativo de uma rede pública que exige
login antes de liberar tráfego, enlace local ainda ativo mas sem rota pra
fora) continua com `navigator.onLine === true`, e nenhum evento `offline`
dispara. É justamente o cenário intermitente (elevador, metrô, sinal fraco)
que esse tipo de aviso normalmente é construído pra cobrir — e é exatamente
onde ele fica mudo, sem erro nem warning, só ausência silenciosa do aviso.

## A checagem ativa

Complemente os eventos passivos com uma sondagem periódica de verdade:

```js
async function checaConectividadeReal(timeoutMs = 4000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    // endpoint pequeno do próprio domínio, ou qualquer URL já cacheada;
    // nunca uma página grande — o objetivo é só confirmar ida-e-volta
    await fetch('/favicon.ico', { cache: 'no-store', signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

function useConectividadeReal(intervaloMs = 15000) {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function verificar() {
      const ok = await checaConectividadeReal()
      if (!cancelado) setOnline(ok)
    }

    verificar()
    const id = setInterval(() => {
      // evita gastar bateria/dados com a aba em segundo plano
      if (document.visibilityState === 'visible') verificar()
    }, intervaloMs)

    document.addEventListener('visibilitychange', verificar)

    return () => {
      cancelado = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', verificar)
    }
  }, [intervaloMs])

  return online
}
```

## Checklist

- [ ] O feedback de "sem conexão" usa `navigator.onLine`/eventos `online`/
      `offline` **e** uma checagem ativa periódica — nunca só o primeiro.
- [ ] A checagem ativa usa `cache: 'no-store'` (uma resposta de cache local
      "confirmaria" conectividade que não existe) e tem timeout curto.
- [ ] A sondagem só roda com a aba visível/focada (`visibilitychange`), pra
      não desperdiçar bateria e dados em segundo plano.
- [ ] Testado manualmente desconectando o roteador/upstream sem desligar o
      Wi-Fi do dispositivo (ou bloqueando o domínio de teste via DNS/hosts) —
      só assim o cenário de "interface ativa, sem internet" é reproduzido;
      modo avião nunca revela essa lacuna porque dispara os eventos normais.
- [ ] O intervalo de sondagem é curto o suficiente pra ser útil (avisar em
      segundos, não minutos) e longo o suficiente pra não gerar tráfego
      perceptível (geralmente entre 10s e 30s já equilibra isso bem).
