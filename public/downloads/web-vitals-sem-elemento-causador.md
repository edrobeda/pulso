# Métrica de campo ruim sem dizer qual elemento causou é meio diagnóstico

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de um caso real para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

> **Atualização:** o padrão abaixo (capturar o elemento no momento da
> medição) generaliza pra INP, não só LCP/CLS — ver seção "E o INP?" mais
> abaixo.

## O problema

Um sistema de RUM (Real User Monitoring) simples, caseiro, costuma coletar
exatamente os números que as bibliotecas de Web Vitals exportam — CLS, LCP,
o valor agregado (p75, por exemplo) — e parar aí. Isso prova que "essa
página está ruim", mas não diz **onde**: qual elemento específico foi o
maior conteúdo pintado (candidato a LCP) ou qual elemento específico se
moveu mais (maior contribuinte de CLS) na sessão daquele visitante real.

Sem essa pista, toda investigação de uma métrica ruim vira tentativa e
erro: suspeitar de um componente, aplicar uma correção, publicar, esperar
dado novo chegar, medir de novo — e repetir até acertar. Cada ciclo desses
custa tempo real, e o custo cresce com o tamanho da página: mais
componentes candidatos, mais chutes antes de acertar o culpado.

O dado pra resolver isso sem chute já existe dentro do próprio browser no
momento em que a métrica é medida — só não é capturado por padrão pelas
bibliotecas que só devolvem o número agregado.

## A lição

As APIs de performance do navegador carregam a atribuição estruturalmente,
não só o valor agregado:

- Uma entry de `largest-contentful-paint` tem um campo `.element` — a
  referência real ao nó do DOM que foi pintado como o maior conteúdo
  visível até aquele momento.
- Uma entry de `layout-shift` tem `.sources[]`, uma lista de todos os
  elementos que participaram daquele deslocamento, cada um com `.node`
  (o elemento) e as posições antes/depois.

Capture essa informação **no momento da medição**, não como um dado
separado que exigiria correlação manual depois (tipo cruzar timestamp de
métrica com log de deploy). Reduza o nó a algo pequeno e seguro de
transportar/exibir — tag + classe/id, nunca o HTML inteiro do elemento ou
uma referência viva ao DOM — e grave isso junto com o valor agregado da
métrica, exibindo os dois lado a lado no mesmo painel que já é consultado
pra olhar a métrica. Isso elimina a etapa de "qual componente é esse" que,
sem atribuição, só se resolve lendo código candidato por candidato ou
tentando reproduzir o problema localmente — o que nem sempre reproduz, se
o culpado depende de dado real (tamanho de conteúdo dinâmico, conexão
lenta) que não existe em ambiente de teste.

### Exemplo mínimo

```js
function elementoResumo(node) {
  if (!node || !node.tagName) return null;
  const tag = node.tagName.toLowerCase();
  const classe = node.className ? `.${String(node.className).trim().split(/\s+/).join('.')}` : '';
  const id = node.id ? `#${node.id}` : '';
  return `${tag}${id}${classe}`.slice(0, 120);
}

new PerformanceObserver((list) => {
  const ultima = list.getEntries().at(-1);
  if (!ultima) return;
  enviarMetrica('LCP', ultima.startTime, {
    elemento: elementoResumo(ultima.element),
  });
}).observe({ type: 'largest-contentful-paint', buffered: true });

let piorShift = null;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.hadRecentInput) continue; // não conta shift causado pelo próprio usuário
    const maiorFonte = entry.sources?.reduce(
      (a, b) => (!a || sizeOf(b) > sizeOf(a) ? b : a),
      null
    );
    if (!piorShift || entry.value > piorShift.value) {
      piorShift = { value: entry.value, elemento: elementoResumo(maiorFonte?.node) };
    }
  }
}).observe({ type: 'layout-shift', buffered: true });

function sizeOf(source) {
  const r = source.node?.getBoundingClientRect?.();
  return r ? r.width * r.height : 0;
}
```

No fim da sessão (ou a cada envio periódico), mande `piorShift` junto com
o valor agregado de CLS — o elemento isolado que mais contribuiu, não só
a soma.

### E o INP?

INP (Interaction to Next Paint) substituiu FID como Core Web Vital
oficial, e mede a interação mais lenta da sessão (clique, toque, tecla) até
o próximo paint. O mesmo padrão de atribuição existe aqui também, só com
nome de campo diferente: a entry do tipo `event` tem `.target`, o nó que
recebeu a interação que gerou aquele atraso.

```js
let piorEvento = null;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const duracao = entry.duration;
    if (!piorEvento || duracao > piorEvento.value) {
      piorEvento = { value: duracao, elemento: elementoResumo(entry.target) };
    }
  }
}).observe({ type: 'event', buffered: true, durationThreshold: 40 });
```

`durationThreshold` evita observar toda interação rápida (a maioria) — só
as que já são candidatas a interação lenta o bastante pra interessar.
`entry.target` pode vir `null` se o elemento já foi removido do DOM entre
a interação e a medição (comum em listas que re-renderizam); trate como
"elemento desconhecido" em vez de deixar `elementoResumo` quebrar.

## Checklist rápido

- [ ] O RUM caseiro captura `.element` da entry de
      `largest-contentful-paint`, não só o `startTime`?
- [ ] O RUM caseiro captura o `.node` do maior `source` de cada entry de
      `layout-shift` (ignorando shifts com `hadRecentInput: true`)?
- [ ] O RUM caseiro captura o `.target` da entry de `event` usada pra medir
      INP, tratando `target` ausente (elemento já removido do DOM) sem
      quebrar?
- [ ] O identificador do elemento gravado é curto e seguro (tag + id/classe
      truncado), nunca o HTML inteiro nem uma referência viva ao DOM?
- [ ] O painel onde a métrica agregada já é exibida mostra também o
      elemento associado, lado a lado — não um dado separado que exige
      correlação manual?
- [ ] A próxima investigação de uma métrica ruim começa lendo o elemento
      atribuído, antes de qualquer tentativa e erro?
