# Aplicar preferência de visitante antes do primeiro paint (evita reflow/CLS)

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de um caso real para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Uma preferência de exibição salva pelo visitante (tamanho de texto, tema,
densidade de layout — qualquer coisa que mude a geometria da página) é lida
de `localStorage` e aplicada dentro de um `useEffect` do React (ou
equivalente de outro framework). Isso roda **depois** do commit inicial,
ou seja, depois do primeiro paint: o visitante vê a página no estado
padrão por um instante e, logo em seguida, ela "pula" pro valor salvo.

Medido com Web Vitals reais em produção, isso aparece como CLS
(Cumulative Layout Shift) ruim — na casa de 0.4 a 0.7, bem acima do limite
aceitável de 0.25 — em praticamente toda página que usa o componente
afetado. Nada quebra funcionalmente (o valor certo sempre acaba aplicado),
é só visível e mensurável como experiência ruim, principalmente em quem já
personalizou a preferência alguma vez.

## Por que acontece

`useEffect` existe pra sincronizar estado **depois** que o DOM já foi
commitado — é a ferramenta certa pra reagir a mudanças, não pra aplicar
algo que precisa estar presente desde o primeiro frame renderizado. Um
valor lido de `localStorage` dentro de um componente React só fica
disponível depois que o JS do bundle carrega, parseia, monta a árvore de
componentes e roda os efeitos — vários passos depois do HTML já ter sido
pintado na tela com o estado padrão.

## A correção: script inline síncrono no `<head>`

A mesma técnica clássica usada pra evitar "flash" de tema claro/escuro
antes de hidratação se generaliza pra qualquer preferência visual
persistida: um script pequeno, inline, direto no `<head>` do HTML,
**antes** de qualquer CSS/JS do bundle carregar — roda de forma síncrona
durante o parse do documento, então o valor já está aplicado no primeiro
frame que o navegador pinta.

```html
<head>
  <meta charset="UTF-8" />
  <script>
    // Aplica a preferência salva antes do primeiro paint — fazer isso depois
    // (useEffect/onMount de qualquer framework) causa reflow de página
    // inteira em todo carregamento pra quem já personalizou, mensurável
    // como CLS alto em produção.
    (function () {
      try {
        var sizes = { sm: '87.5%', md: '100%', lg: '112.5%', xl: '125%' }
        var stored = localStorage.getItem('minha-app-text-size')
        if (sizes[stored]) document.documentElement.style.fontSize = sizes[stored]
      } catch (e) {}
    })()
  </script>
  <!-- resto do <head>: título, meta tags, link pro CSS do bundle -->
</head>
```

Pontos que importam nesse padrão:

- **`try/catch` em volta de tudo.** `localStorage` pode lançar em modo
  privado restrito de alguns navegadores — o script não pode quebrar o
  carregamento da página por causa disso.
- **Mapa de valores fixo e pequeno** (`sizes`), nunca aplicar o valor cru
  do storage direto no CSS — evita que um valor corrompido/injetado vire
  CSS arbitrário.
- **O componente React correspondente não precisa mais aplicar o valor no
  mount** — só precisa inicializar seu próprio estado interno lendo o
  mesmo `localStorage`, pra manter os controles (botões de aumentar/
  diminuir, por exemplo) sincronizados com o que o script já aplicou. Ele
  continua sendo responsável por aplicar mudanças **depois** de uma
  interação do usuário (isso sim é o caso certo de uso de efeito/handler).

## Checklist

- [ ] Toda preferência visual persistida que afeta layout é aplicada por
      um script inline síncrono no `<head>`, nunca só em `useEffect`/
      `onMount`.
- [ ] O script fica antes de qualquer tag `<link>`/`<script>` do bundle no
      `<head>`.
- [ ] Leitura do storage envolvida em `try/catch`.
- [ ] Valor lido é validado contra um mapa fixo de valores conhecidos antes
      de virar CSS — nunca aplicado cru.
- [ ] O componente do framework inicializa seu próprio estado a partir do
      mesmo storage (pra manter UI e DOM consistentes), mas não reaplica o
      valor ao montar — só reage a mudanças depois da interação do usuário.
- [ ] Medido com Web Vitals reais (CLS) antes/depois da correção, não só
      visualmente — o salto pode ser pequeno o bastante pra passar
      despercebido numa tela e ainda contar como "poor" no campo.
