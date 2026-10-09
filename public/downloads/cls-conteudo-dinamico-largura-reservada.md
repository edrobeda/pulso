# Conteúdo que atualiza sozinho precisa de largura reservada (CLS contínuo)

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de um caso real para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Um elemento de texto que se atualiza sozinho com um timer (contador
regressivo, relógio, número ao vivo, ticker de preço/placar) muda de
quantidade de caracteres entre uma atualização e outra — "47min" vira
"8h05", "1.234" vira "987". Se esse elemento não tem largura reservada,
cada atualização empurra o que está ao lado (ou embaixo, dependendo do
layout) um pouco pra lá e pra cá.

A diferença pro CLS (Cumulative Layout Shift) "clássico" de carregamento de
página é que isso **não acontece uma vez só, no load** — acontece a cada
intervalo do timer, durante todo o tempo que a página fica aberta. Alguém
lendo por 5 minutos com um timer de 30 segundos sofre o mesmo pequeno
reflow umas 10 vezes seguidas. Cada ocorrência isolada é pequena demais
pra notar olhando a tela; o que mata a métrica é a soma ao longo da
sessão.

É fácil não perceber testando manualmente: um teste rápido de alguns
segundos no devtools, ou uma rodada de Lighthouse (que mede uma janela
curta e sintética), não necessariamente captura uma atualização de timer
acontecendo nesse intervalo. O problema só aparece claramente em dado de
campo (CLS medido em usuários reais, não em laboratório) — e mesmo assim só
se alguém estiver de fato coletando e olhando esse dado.

## A lição

Qualquer texto que atualiza sozinho e cuja contagem de caracteres varia
precisa de espaço reservado pro **pior caso**, não pro que cabe agora:

1. **Descubra o maior valor plausível do formato.** Um contador tipo
   "Xh YYmin"/"YYmin" tem um teto conhecível (ex.: `"18h59"` ou `"59min"`,
   nunca mais que 5 caracteres). Um contador de visitantes ao vivo, se não
   tem teto natural, escolha um valor alto o bastante pra cobrir o
   realista (`"9999+"`).
2. **Reserve esse espaço explicitamente**, não deixe o navegador decidir:
   `min-width` em unidade `ch` (que já é relativa ao tamanho da fonte) é
   geralmente mais simples que calcular pixels. Ex.:
   ```css
   .contador-dinamico {
     display: inline-block;
     min-width: 5ch;
     font-variant-numeric: tabular-nums; /* dígitos de largura igual */
   }
   ```
3. **Use uma fonte (ou variante) com dígitos de largura fixa** quando o
   conteúdo é majoritariamente numérico — `font-variant-numeric:
   tabular-nums` ou uma fonte monoespaçada evita que só a troca de dígito
   (ex.: "1" mais estreito que "8") já cause um micro-shift mesmo com
   `min-width` certo.
4. **Teste olhando a sessão inteira, não o primeiro segundo.** Abra a
   página, espere pelo menos dois ou três ciclos do timer, e confirme
   visualmente (ou via `PerformanceObserver` de `layout-shift` no
   DevTools) que nada ao redor se move quando o valor muda.
5. **Meça CLS de campo em produção**, não só o score sintético de uma
   rodada de Lighthouse — um RUM simples (`web-vitals` reportando pra um
   endpoint seu, por exemplo) com percentil (p75) é o que realmente prova
   que o problema existe e que o fix funcionou, porque a janela sintética
   de um teste de poucos segundos pode nunca pegar um ciclo de atualização
   do timer.

## Checklist rápido

- [ ] Todo texto atualizado por `setInterval`/timer foi revisado quanto a
      variação de largura?
- [ ] Existe `min-width` (ou equivalente) cobrindo o maior valor plausível
      do formato, não só o que aparece no momento do teste?
- [ ] Dígitos usam `font-variant-numeric: tabular-nums` ou fonte
      monoespaçada, se o conteúdo é majoritariamente numérico?
- [ ] O teste manual observou pelo menos 2-3 ciclos completos do timer,
      não só o primeiro segundo de carregamento?
- [ ] Existe CLS de campo (RUM) sendo coletado, e não só o score sintético
      de uma ferramenta de lab?
