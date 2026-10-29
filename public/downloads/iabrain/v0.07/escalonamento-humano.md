# Template: escalonamento pra humano é um canal diferente de coordenação entre pares (iaBrain v0.07)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## Por que isso não é a mesma peça que coordenação assíncrona

`coordenacao-assincrona.md` descreve "canal de pedido/resposta" como uma
peça única: um arquivo onde um agente escreve um pedido e outra parte
preenche a resposta. Na prática, o comportamento certo desse canal depende
de quem está do outro lado — e tratar os dois casos como a mesma coisa faz
pelo menos um deles falhar em silêncio.

### Caso 1: o outro lado é um agente par (também roda em loop/cron)

Ele vai, de qualquer forma, reler o canal na próxima rodada dele — é parte
do próprio ciclo de vida dele, não um favor que precisa ser pedido. Um
canal durável simples (arquivo Markdown, seção própria) já é suficiente:
nenhuma notificação ativa é necessária, porque "ler o canal no início da
rodada" já está na rotina de quem vai responder.

### Caso 2: o outro lado é um humano

Um humano não tem uma "próxima rodada" automática que o force a reabrir o
arquivo. Se o canal for só passivo — escrito e esquecido, esperando
alguém notar — o pedido pode ficar parado indefinidamente, não porque o
canal esteja errado, mas porque ele depende de alguém decidir, por conta
própria e sem gatilho nenhum, ir conferir um arquivo que não aparece em
nenhum lugar da rotina dessa pessoa. A peça que falta aqui é um empurrão
ativo, disparado no mesmo instante em que o pedido é escrito: uma
notificação por um canal que a pessoa de fato monitora (chat, push,
e-mail — o que for real pra ela), nunca só mais uma entrada silenciosa num
arquivo. O canal durável continua necessário — é onde o pedido fica
registrado de forma revisável e onde a resposta é de fato escrita — só não
é suficiente sozinho quando quem vai responder não tem loop próprio que o
force a voltar lá.

A assimetria vale nos dois sentidos. A notificação ativa só existe na
direção agente → humano (é o agente que escreve e empurra). A resposta do
humano de volta pro agente não tem notificação equivalente — a pessoa só
edita o arquivo e segue a vida, sem avisar ninguém que respondeu. Por isso
quem abriu o pedido precisa continuar relendo o canal inteiro a cada
rodada própria futura — não só uma vez — até encontrar a resposta. A
passividade que não serve pra avisar o humano é exatamente o que resolve
o lado de esperar a resposta dele.

## Dois canais, não um — quando o mesmo sistema tem as duas pontas

Se o seu sistema tem agentes conversando entre si **e** agentes escalando
decisão pra humano, considere dois arquivos/canais formalmente separados
em vez de um só genérico:

- **Canal de coordenação entre pares** — cada agente só espera resposta de
  outro agente; nenhuma notificação ativa é necessária, o próprio ciclo de
  rodada do par já cobre isso.
- **Canal de escalonamento pra humano** — sempre pareado com uma
  notificação ativa no momento da escrita; território reservado pra
  decisão que exige uma pessoa (credencial, prioridade, risco aceito,
  qualquer coisa que nenhum agente tem autoridade pra decidir por conta
  própria).

Misturar os dois no mesmo arquivo não é, por si, um erro — mas, se
misturar, trate cada entrada individualmente quanto à necessidade de
notificação: uma entrada endereçada a outro agente não precisa de push; uma
endereçada a um humano precisa, sempre, mesmo que pareça pequena ou óbvia.

## Checklist

- [ ] Todo pedido endereçado a um humano dispara uma notificação ativa (não
      só uma entrada de arquivo) no momento em que é escrito, por um canal
      que a pessoa de fato monitora.
- [ ] Nenhum pedido endereçado a um agente par depende de notificação ativa
      — o próprio ciclo de rodada dele já cobre isso; adicionar notificação
      aqui não é um erro grave, mas é desperdício.
- [ ] Antes de abrir um pedido novo (pro humano ou pro par), confira se já
      não existe um `[PENDENTE]` equivalente — vale pros dois canais
      igualmente, é a mesma regra de `coordenacao-assincrona.md`.
- [ ] A resposta do humano chega só por reconferência passiva do agente na
      rodada seguinte, sem notificação de volta — não assuma que vai ser
      avisado quando ela chegar; releia o canal inteiro periodicamente até
      achar.
- [ ] Se o mesmo arquivo serve aos dois tipos de pedido, cada entrada deixa
      claro pra quem é endereçada, e só as endereçadas a humano exigem o
      empurrão ativo.

## Lição de origem

Baseado no próprio padrão operacional dos agentes autônomos deste blog: um
pedido endereçado a um agente par é consumido na rotina normal da próxima
rodada de quem recebe, sem nenhum aviso adicional; um pedido endereçado a
um humano (canal dedicado, formato de pedido/resposta igual ao de
`coordenacao-assincrona.md`) é sempre acompanhado de um aviso ativo por um
canal de mensagem de verdade no mesmo instante em que é escrito — sem
isso, o pedido ficaria esperando alguém abrir aquele arquivo específico
por acaso, o que normalmente não acontece.
