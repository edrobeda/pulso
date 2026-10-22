# Template: coordenação assíncrona entre agentes independentes (iaBrain v0.02)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## Por que isso não é o mesmo padrão de subagente

O par orquestrador → subagente (ver `orquestrador-prompt.md` e
`subagente-template.md`) assume uma coisa importante: as duas partes
existem dentro da mesma sessão. O orquestrador chama, espera, recebe a
resposta de volta, tudo na mesma janela de tempo.

Isso não cobre um caso comum na prática: vários agentes **genuinamente
independentes**, cada um disparado no seu próprio horário (cron, webhook,
fila), que nunca compartilham contexto e podem rodar com horas ou dias de
diferença um do outro. Não dá pra "delegar e esperar retorno" quando o
outro agente ainda nem começou a rodar. Esse é o quinto padrão do kit:
como agentes que não se veem ao vivo ainda assim coordenam trabalho,
pedem decisões um ao outro (ou a um humano) e evitam pisar no escopo
alheio — só através de estado durável, nunca por chamada direta.

## As três peças de estado durável

### 1. Canal de pedido/resposta (arquivo compartilhado)

Um arquivo Markdown (ex.: `NECESSIDADES.md`) onde qualquer agente pode
abrir um pedido no topo — uma decisão, uma credencial, um acesso que ele
não tem escopo pra resolver sozinho — e outro agente (ou um humano) edita
o mesmo arquivo preenchendo a resposta. Na rodada seguinte, quem abriu o
pedido relê o arquivo inteiro, processa qualquer resposta nova encontrada
e marca a entrada como resolvida.

Regras que evitam os dois erros mais comuns desse padrão:
- **Antes de abrir um pedido novo, sempre conferir se já não existe um
  equivalente `[PENDENTE]`** — sem essa checagem, o canal enche de
  duplicata a cada rodada que não recebeu resposta ainda.
- **Segredo devolvido pelo canal não fica nele.** Se a resposta trouxe uma
  credencial, ela é movida pro lugar apropriado (variável de ambiente,
  cofre) e apagada do arquivo assim que consumida — o canal é meio de
  transporte, não armazenamento permanente de segredo em texto puro.

### 2. Log append-only (memória de execução compartilhada)

Um arquivo onde cada agente só acrescenta uma entrada no topo/fim
descrevendo o que fez naquela rodada — nunca edita uma entrada de rodada
anterior. É a forma de um agente saber "o que já aconteceu" sem ter
estado vivo nem acesso à sessão de quem rodou antes dele.

Vale o mesmo princípio de eficiência de contexto do resto do kit: quem lê
esse log não precisa reler o arquivo inteiro toda rodada — as últimas
entradas (`tail -n 20`, últimas N linhas) já bastam pra saber o que mudou
desde a última vez. Reler tudo desde o início a cada rodada é o mesmo tipo
de desperdício descrito em `notas-de-design.md` pra memória que ninguém
consulta de verdade.

### 3. Tabela de status compartilhada (visível, não só gravada)

Um registro pequeno e estruturado (uma tabela, uma linha por evento) que
serve dois propósitos ao mesmo tempo: histórico consultável por outro
agente, e superfície visível por um humano sem precisar entrar no
servidor ler log (um painel, uma página de status). Gravar o resultado de
uma verificação não é o mesmo que alguém saber que ela rodou — ver
"verificação que só o processo vê" no catálogo de lições deste laboratório
é o mesmo ponto cego, agora aplicado a coordenação entre agentes: se
nenhum dos dois lados (nem outro agente, nem um humano) olha pro estado
gravado, ele não coordenou nada, só documentou pra ninguém.

## Regras de convivência (o que evita colisão)

- **Escopo de escrita travado por arquivo/seção, não por convenção
  verbal.** Cada agente só edita os arquivos/tabelas do seu próprio
  território; se precisa de algo fora dele, registra um pedido no canal
  de pedido/resposta em vez de editar diretamente — mesmo que tecnicamente
  conseguisse.
- **Todo dado exposto num canal público (dashboard, página de status)
  passa por um filtro de sanitização antes de sair** — nunca hostname
  interno, caminho de servidor, nome de outro serviço compartilhado ou
  credencial, mesmo que o dado bruto contenha isso.
- **Nenhum agente assume que o outro já leu o que ele escreveu.** Sem
  sessão compartilhada não existe "eu avisei, ele deve saber" — o estado
  durável (arquivo, tabela) é a única prova de que uma informação foi
  realmente transmitida.

## Quando usar este padrão em vez do par orquestrador/subagente

- Os agentes rodam em horários diferentes, potencialmente sem nenhuma
  sobreposição no tempo (cron diário, semanal).
- Não existe uma sessão "pai" viva que possa esperar a resposta — cada
  agente começa e termina sozinho.
- Os agentes têm escopos de arquivo/permissão propositalmente separados
  (isolamento por design, não só por organização de código), e a
  coordenação entre eles precisa ser auditável depois do fato — todo
  pedido e toda resposta ficam registrados em texto, não em uma troca
  efêmera que desaparece com a sessão.
