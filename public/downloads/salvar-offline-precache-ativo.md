# Salvar pra offline precisa de pré-cache ativo, não só de visita anterior

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Um app com service worker em modo network-first (ver a lição sobre
cache-first travando em versão velha, se você ainda não resolveu isso)
cacheia página e dados **conforme o usuário navega** — abriu a URL enquanto
online, ela fica disponível depois sem rede. Isso cobre bem o caso de
"abri antes, quero reabrir offline".

Não cobre o caso de um botão "salvar pra ler depois": a intenção de quem
clica ali é exatamente a oposta — marcar algo que ainda **não abriu**,
pra ler depois, possivelmente sem conexão (no metrô, num avião, com rede
ruim). Se salvar só grava um identificador numa lista local sem tocar no
cache do service worker, o item "salvo" não tem nenhum conteúdo cacheado:
na hora de abrir offline, aparece tela de erro de rede em algo que a
própria UI do app classificou como disponível.

Nada disso aparece testando o caminho feliz (abrir, depois salvar, depois
reabrir) — só aparece testando a ordem que o recurso existe pra resolver:
salvar algo nunca visto, ficar offline, só então tentar abrir.

## A lição

Pré-cache é uma ação, não uma consequência passiva de navegação. A lógica
de "salvar" precisa, ela mesma, buscar e cachear tudo que a página
precisa pra renderizar sem rede — no momento do clique, não depois.

- `fetch()` explícito de cada URL necessária (rota/shell da página + toda
  chamada de API que ela faz pra montar o conteúdo) e `cache.put()` de cada
  resposta bem-sucedida, usando a mesma chave/versão de cache que o próprio
  service worker usa pra servir essas URLs depois.
- Trate como best-effort: um `try/catch` que não propaga erro. Se o clique
  em salvar aconteceu sem rede, ou a Cache API não existe no navegador, o
  item simplesmente não fica garantido offline — não é motivo pra quebrar
  a ação de salvar em si.
- Espelhe a limpeza: desmarcar como salvo deveria remover as mesmas
  entradas do cache (`cache.delete`). Sem isso, o cache só cresce — cada
  item que já foi salvo um dia e depois descartado continua ocupando
  espaço indefinidamente.
- Rode o mesmo pré-cache pra qualquer item que já estava salvo antes dessa
  funcionalidade existir, na primeira tela que lista os salvos (ex.: um
  `useEffect` que itera a lista salva e dispara o pré-cache de cada um).
  Sem isso, só os itens salvos a partir do deploy que introduziu o
  pré-cache ficam cobertos — os salvos antes continuam quebrados até
  alguém dessalvar e salvar de novo.

Se o nome da chave de cache vive em dois arquivos diferentes (o script
clássico do service worker e um módulo ES importado pela aplicação, sem
import compartilhado entre os dois mundos), documente isso explicitamente
e mantenha os dois em sincronia manual — é fácil uma mudança de versão de
cache atualizar um lado e esquecer o outro, e o sintoma (pré-cache escreve
numa chave que o service worker não lê mais) não gera nenhum erro, só um
cache que nunca é usado.

## Template mínimo

```js
// mesma chave/versão de cache que o service worker usa para servir estas URLs
const CACHE_VERSION = 'app-v1'

export async function precacheForOffline(urls) {
  if (!('caches' in window)) return
  try {
    const cache = await caches.open(CACHE_VERSION)
    await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(url)
        if (response.ok) await cache.put(url, response)
      })
    )
  } catch {
    // best-effort — se falhar, o item só não fica garantido offline
  }
}

export async function dropOfflineCache(urls) {
  if (!('caches' in window)) return
  try {
    const cache = await caches.open(CACHE_VERSION)
    await Promise.all(urls.map((url) => cache.delete(url)))
  } catch {
    // best-effort, ver precacheForOffline
  }
}
```

Chame `precacheForOffline([...])` no mesmo clique que marca o item como
salvo, `dropOfflineCache([...])` no clique que desmarca, e repita o
pré-cache pra todos os itens já salvos na primeira renderização da tela
de "salvos".

## Checklist

- [ ] Salvar dispara `fetch` + `cache.put()` das URLs necessárias no
      momento do clique — não depende de visita futura.
- [ ] Falha no pré-cache (offline, Cache API ausente) não quebra a ação de
      salvar — best-effort, silencioso.
- [ ] Desmarcar como salvo libera o espaço correspondente no cache.
- [ ] Itens salvos antes dessa funcionalidade existir são cobertos na
      primeira tela que lista os salvos.
- [ ] Teste real: salve algo nunca aberto, fique offline (DevTools →
      Network → Offline), abra o item salvo — tem que renderizar.
- [ ] Se a chave de cache vive em dois arquivos sem import compartilhado,
      isso está documentado e os dois lados ficam versionados juntos.
