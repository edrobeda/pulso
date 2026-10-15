# Validar contraste de uma cor por fundo onde ela é usada

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Contraste de cor (WCAG) não é uma propriedade de uma cor isolada — é uma
relação entre duas cores: o texto e o fundo específico atrás dele. É comum
uma variável de cor nascer num único contexto (ex. texto sobre o fundo
escuro predominante do site), ser checada visualmente ali, e depois ser
reaproveitada em componentes completamente diferentes que puxam a mesma
variável — um card com fundo claro, um tema alternativo, um modo de leitura.
Nada no código avisa quando isso quebra o contraste num desses fundos novos:
o texto continua aparecendo, só fica difícil de ler, e geralmente só é
percebido em auditoria manual ou quando alguém com baixa visão reclama.

## Checklist

- [ ] Liste toda variável de cor usada como **texto** (não só decoração) e,
      para cada uma, todo fundo distinto onde ela realmente aparece hoje —
      não só o fundo onde ela nasceu.
- [ ] Calcule o contraste real (fórmula de luminância relativa do WCAG,
      script abaixo) para cada par cor-de-texto × fundo. Mínimo AA: 4.5:1
      para texto normal, 3:1 para texto grande (≥ 18px bold ou ≥ 24px).
- [ ] Onde um par falhar, não escureça/altere a variável original — crie uma
      variável derivada, nomeada pelo contexto (`--cor-dim-on-paper`,
      `--cor-dim-on-dark`), e troque só os usos daquele fundo específico para
      ela. Isso evita quebrar o contraste nos fundos onde a cor original já
      passava.
- [ ] Se o projeto tem mais de um tema (claro/escuro, modo de leitura,
      impressão), repita a checagem em cada tema — uma variável que já é
      sobrescrita por tema (custom property redefinida num seletor de tema)
      precisa ser testada tema por tema, não só uma vez.
- [ ] Depois de corrigir, re-rode o script contra todos os pares que
      passavam antes da mudança, não só o que falhava — a correção não pode
      silenciosamente derrubar um contraste que já estava bom.

## Script: contraste WCAG entre pares cor × fundo

Node.js puro, sem dependência. Edite a lista `pairs` com as cores reais do
seu projeto (valores hex) e rode com `node contraste.js`.

```js
// contraste.js
function hexToRgb(hex) {
  const n = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
}

function relativeLuminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hexA, hexB) {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

// cada par: [nome, cor de texto, cor de fundo, é texto grande?]
const pairs = [
  ['tag-pill:hover sobre papel claro', '#b8834a', '#ece9dd', false],
  ['tag-pill:hover sobre fundo escuro', '#b8834a', '#171310', false],
];

for (const [nome, fg, bg, isLarge] of pairs) {
  const ratio = contrastRatio(fg, bg);
  const minimo = isLarge ? 3 : 4.5;
  const status = ratio >= minimo ? 'OK' : 'FALHA';
  console.log(`${status} ${nome}: ${ratio.toFixed(2)}:1 (mínimo ${minimo}:1)`);
}
```

## Lição

A mesma variável de cor pode passar no contraste mínimo contra um fundo e
falhar contra outro sem que o código dê nenhum sinal disso — contraste é uma
relação, não uma propriedade da cor isolada. Ao reaproveitar uma cor de
texto num fundo novo (um card, um tema alternativo, um modo de leitura),
meça o contraste de novo contra aquele fundo específico. Quando o mesmo tom
precisa de contraste diferente em fundos diferentes, prefira uma segunda
variável derivada e escopada ao contexto, em vez de escurecer a variável
original — isso preserva o tom correto nos fundos onde ela já passava.
