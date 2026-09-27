# Checklist: bloqueio de segurança de uma API de LLM não é um bug de código

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo, extraído e adaptado de um caso real para uso genérico.
> É um ponto de partida, não uma solução pronta — adapte e teste no seu
> próprio ambiente antes de confiar nele. O autor não se responsabiliza por
> qualquer dano, perda de dados ou mau funcionamento decorrente do uso
> deste conteúdo.

## O problema, em uma frase

Um job agendado que chama uma API de LLM pra gerar conteúdo pode falhar
sem nenhum bug de código, sem falha de rede/banco/disco — o próprio
provedor recusa a chamada antes de gerar qualquer resposta, porque o
classificador de segurança em tempo real dele sinalizou o conteúdo (o
tema do prompt, algo trazido de uma busca, um trecho citado). O processo
sai com erro, mas todo o resto do ambiente está saudável: é uma categoria
de falha diferente de "bug" e diferente de "infra caiu".

## Por que isso é fácil de tratar errado

- **Parece um bug transitório e não é.** Repetir a mesma chamada com o
  mesmo conteúdo tende a bater no mesmo bloqueio de novo — não é uma
  falha de rede que passa ao tentar de novo.
- **Tentar contornar o classificador é o erro maior.** Reformular o
  prompt especificamente pra escapar da detecção, quebrar o conteúdo em
  pedaços pra "diluir" o sinal, ou trocar de modelo/provedor só pra
  burlar a recusa transformam um bloqueio legítimo de segurança em alvo
  de evasão — isso não é uma correção de engenharia, é o tipo de
  contorno que o próprio classificador existe pra impedir.
- **Um alerta genérico ("job falhou, exit 1") esconde a causa real.**
  Sem distinguir esse caso de qualquer outro erro, quem investiga depois
  vai procurar bug de código ou falha de infraestrutura onde não tem
  nenhum dos dois.
- **Não é algo que o seu próprio código consegue resolver sozinho.** É
  uma política do lado do provedor — a correção, se houver, é uma decisão
  de produto/negócio (ex.: programas de verificação que reduzem falso
  positivo), não um patch no seu pipeline.

## O padrão que resolve

1. **Detecte e classifique esse erro como sua própria categoria**, não
   como "falha genérica" — a maioria das APIs de LLM devolve um código ou
   mensagem específica pra recusa de segurança, diferente de erro de
   rede/rate-limit/timeout. Capture esse sinal explicitamente no
   log/histórico do job.
2. **Nunca implemente retry automático que reenvia o mesmo conteúdo**
   esperando que passe da próxima vez — na melhor das hipóteses é
   inútil, na pior é o primeiro passo de um padrão de evasão. Se faz
   sentido tentar de novo, tente com uma abordagem genuinamente diferente
   decidida por um humano, não um loop automático.
3. **Trate "esta rodada não produziu nada" como um estado sobrevivível,
   não uma pane.** O job seguinte (próximo horário agendado) deve rodar
   normalmente; a ausência de resultado numa rodada não deve travar nem
   corromper as seguintes. Grave a lacuna no histórico (linha "sem
   publicação" ou equivalente) em vez de deixar um buraco silencioso.
4. **Escale como decisão, não como chamado de bug.** Se o bloqueio se
   repetir com alguma frequência em conteúdo legítimo, isso é sinal pra
   quem decide política/produto avaliar opções do lado do provedor — não
   algo que o próprio agente deveria tentar resolver reescrevendo prompts
   até passar.

## Checklist rápido pra aplicar num pipeline já existente

- [ ] O código distingue "recusa de segurança do provedor" de erro de
      rede, timeout, rate-limit e exceção de aplicação — em log e em
      alerta, não só num `exit 1` genérico?
- [ ] Não existe nenhum retry automático que reenvia o mesmo conteúdo
      pro mesmo classificador esperando resultado diferente?
- [ ] Nenhuma lógica no pipeline tenta reformular/fragmentar/trocar de
      modelo especificamente pra escapar da detecção?
- [ ] Uma rodada sem resultado por esse motivo fica registrada como
      lacuna visível (histórico, changelog, tabela de status) em vez de
      falha silenciosa?
- [ ] A rodada seguinte roda normalmente, sem depender de estado que a
      rodada bloqueada deveria ter deixado pronto?
- [ ] Se o padrão se repete, existe um canal pra escalar isso como
      decisão de produto/política — não só uma tentativa recorrente de
      contornar via código?
