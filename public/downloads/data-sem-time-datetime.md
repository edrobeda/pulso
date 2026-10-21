# Checklist: data exibida como texto formatado não é reconhecida como data

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano, perda de dados ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Uma data ou timestamp (data de publicação, data de um comentário, "há 3
dias") quase sempre é renderizada como texto já formatado dentro de um
elemento genérico (`<span>`, `<p>`, `<div>`) — visualmente perfeito, mas
sem nenhum sinal estrutural no DOM de que aquele texto representa uma
data. Nada quebra, nada dá erro, a página parece exatamente igual pra
qualquer visitante comum, e por isso é fácil essa lacuna existir em todo
lugar do site que mostra uma data sem que ninguém note.

Duas audiências que não são "visitante comum olhando a tela" pagam o
preço disso:

- **Leitor de tela**: lê o texto literal ("21 de out" ou "há 3 dias") sem
  nenhum contexto adicional de que aquilo é uma data, e sem valor absoluto
  disponível quando o texto visível é relativo.
- **Crawler de busca / extrator de dados estruturados**: não tem como
  extrair um valor de data confiável a partir de texto formatado
  livremente — teria que parsear a string, adivinhando idioma, fuso e
  formato, o que é frágil e nada padronizado.

Caso real: um site com várias datas visíveis (data de post, data de
comentário/resposta, data de item de histórico) tinha todas elas em
`<span>`/`<p>` com texto formatado — nenhuma usava a tag HTML pensada
exatamente para isso.

## Por que a correção é barata e o problema persiste mesmo assim

A solução já existe nativamente em HTML há anos (`<time>`) e a troca não
muda nada visualmente — é exatamente por ser tão barata e indolor que
costuma ficar esquecida: ninguém é forçado a lembrar, porque o custo de
não fazer nunca aparece como erro, só como ausência silenciosa de
acessibilidade e de dado estruturado.

## Checklist

- [ ] Liste todo lugar do site onde uma data ou timestamp aparece pro
      usuário (data de publicação, data de edição, data de comentário,
      "há X tempo", data de qualquer item de histórico/log visível).
- [ ] Troque o elemento genérico por `<time dateTime="...">`, mantendo o
      texto visível e as classes CSS exatamente como estavam — zero
      mudança de layout:
      ```jsx
      // Antes
      <span className="post-date">21 de outubro de 2026</span>

      // Depois
      <time dateTime="2026-10-21T13:00:00-03:00" className="post-date">
        21 de outubro de 2026
      </time>
      ```
- [ ] O atributo `dateTime` precisa ser um valor de máquina real (ISO
      8601, com fuso quando o horário importa) — não repita o texto
      formatado ali. O conteúdo visível entre as tags pode continuar
      sendo texto relativo ("há 3 dias") ou localizado, livremente.
- [ ] Se o texto visível é relativo ("há 3 dias") e muda com o tempo,
      ainda assim o `dateTime` precisa ser o timestamp absoluto fixo do
      evento — nunca recalculado a cada render.
- [ ] Faça a troca em todas as ocorrências do site de uma vez (grep por
      onde data é renderizada), não só na tela que motivou a mudança — é
      comum a mesma lacuna existir em paralelo em componente de post,
      comentário e qualquer outra lista com timestamp, cada um escrito
      por conta própria sem reaproveitar um componente comum.
- [ ] Confirme inspecionando o HTML renderizado (`curl` na página ou
      DevTools) e procurando por `<time`: toda data visível deveria
      corresponder a uma ocorrência.

## Generalização

Mesma família de lição de outras entradas deste catálogo sobre semântica
correta de HTML (`<button>` em vez de `<div onClick>`, `role="alert"` em
vez de texto solto que aparece no DOM): a marcação certa não é só estética
nem só sobre leitor de tela — ela é o contrato que outras ferramentas
(crawler, extrator de dados estruturados, leitor de tela, exportador de
calendário) usam para entender o conteúdo sem ter que adivinhar.
