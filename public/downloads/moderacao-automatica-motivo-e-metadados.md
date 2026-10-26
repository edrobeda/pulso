# Checklist: moderação automática precisa de motivo registrado, não só ausência

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo, extraído e adaptado de um caso real para uso genérico.
> É um ponto de partida, não uma solução pronta — adapte e teste no seu
> próprio ambiente antes de confiar nele. O autor não se responsabiliza por
> qualquer dano, perda de dados ou mau funcionamento decorrente do uso
> deste conteúdo.

## O problema

Um sistema de moderação coletiva (N visitantes distintos sinalizando o
mesmo item faz ele ser ocultado automaticamente) costuma nascer simples:
uma coluna `hidden = true` (ou um `DELETE`) quando o limiar de sinalizações
é atingido. De fora — pra quem só vê a lista pública — um item ocultado
por moderação automática e um item removido pelo próprio autor parecem
exatamente a mesma coisa: ausência. Sem distinguir os dois casos, duas
perguntas importantes ficam sem resposta:

- A moderação automática está realmente funcionando, ou nunca disparou?
- Ela ocultou por engano algo legítimo (falso positivo de sinalização em
  massa, brigada coordenada, etc.)?

## Checklist

- [ ] **Motivo como dado estruturado, não inferido.** No momento em que o
      item é ocultado, grave *por quê* (coluna/enum: `hidden_reason` ou
      equivalente — `auto_flagged` vs. `self_deleted` vs. outro motivo que
      exista no seu sistema). Nunca deixe os dois casos colapsarem no mesmo
      "não existe mais".
- [ ] **Grave também o quando e o quanto.** Timestamp da ocultação e a
      contagem de sinalizações que disparou o limiar — isso é o que
      permite alguém auditar depois se o limiar está calibrado certo.
- [ ] **Exponha onde um humano já olha.** Mesma lição de
      [verificação-que-só-o-processo-vê](verificacao-que-so-o-processo-ve.md):
      uma linha de histórico que ninguém nunca abre não resolve nada.
      Um painel interno já visitado rotineiramente é melhor que exigir
      consulta manual ao banco.
- [ ] **Metadados sim, conteúdo nunca.** O endpoint/página que expõe essa
      atividade devolve só metadados (quando, em qual item, quantas
      sinalizações) — **nunca** o texto/conteúdo que foi ocultado. Se o
      motivo da ocultação for abuso/spam, republicar esse conteúdo numa
      tela "só interna" ainda é republicar o que a moderação existia
      justamente para impedir. O endpoint que lista isso deve excluir
      explicitamente a coluna de conteúdo (ver também a lição sobre
      `SELECT *` numa tabela com coluna sensível).
- [ ] **Teste o caso de falso positivo.** Force manualmente o limiar de
      sinalização contra um item legítimo em ambiente de teste e confirme
      que ele aparece no painel de auditoria como `auto_flagged` — isso é
      o que permite um humano reverter antes de confiar demais na
      automação.
