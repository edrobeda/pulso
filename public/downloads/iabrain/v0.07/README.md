# iaBrain v0.07

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo. É um padrão de arquitetura e um conjunto de templates —
> não um framework pronto pra rodar. Leia, entenda e adapte antes de usar em
> produção. O autor não se responsabiliza por qualquer dano, custo de API,
> perda de dados ou mau funcionamento decorrente do uso deste conteúdo.
> **Nunca rode um agente autônomo com acesso amplo sem antes validar o
> comportamento dele manualmente, várias vezes, num ambiente que você possa
> perder sem problema.**

## O que é isso

`iaBrain` é um padrão de arquitetura pra montar um sistema de agentes de IA
com peças que se combinam sempre do mesmo jeito, não importa qual
ferramenta/harness você usa por baixo (Claude Code, OpenCode, uma API crua,
outra coisa qualquer). A versão é versionada de propósito — é um ponto de
partida validado em casos de uso reais, não uma spec fechada. Cada versão
nova vive na sua própria pasta (`iabrain/v0.0X/...`), a anterior nunca é
sobrescrita.

## As quatro peças centrais

Cobrem o caso de vários agentes (ou um orquestrador + subagentes) que
existem dentro da mesma sessão/processo, com uma janela de contexto
efetivamente compartilhada ou delegável ao vivo.

### 1. Orquestrador
Recebe a mensagem do usuário, decide se responde direto ou delega. Lê o
contexto (memória + histórico da conversa) **antes** de rotear — a decisão
de delegar ou não depende do que já se sabe, não só do texto da última
mensagem. É o único componente que "fala" com o usuário; subagentes
reportam de volta pra ele, nunca direto pro usuário. Ver
`orquestrador-prompt.md`.

### 2. Subagentes
Cada um tem escopo estreito e um prompt otimizado pra esse escopo
específico (pesquisa, código, escrita, o que for). Rodam com sua própria
janela de contexto — vantagem dupla: podem rodar em paralelo, e não poluem
a conversa principal com passos intermediários (buscas, tentativas,
raciocínio de meio de caminho). O orquestrador junta os resultados no
final. Ver `subagente-template.md`.

### 3. Skills
Não são "agentes" — são documentos de referência com boas práticas
específicas de uma tarefa (formato, checklist, exemplo de código, o que
for). Qualquer subagente (ou o próprio orquestrador) consulta o skill
relevante antes de agir, em vez de improvisar só com conhecimento genérico
do modelo. Um skill bom é específico o bastante pra mudar o resultado —
"como formatar uma resposta de X" bate muito mais forte que "seja
cuidadoso". Ver `skill-template.md`.

### 4. Memória
O único componente que sobrevive entre conversas. Divida por tipo de
arquivo pra não virar uma bagunça — quatro categorias que cobrem a maior
parte do que vale a pena persistir:
- **profile** — fatos estáveis sobre quem você está ajudando (papel,
  responsabilidades, nível de conhecimento em cada área).
- **preferences** — como essa pessoa quer que você trabalhe (o que evitar,
  o que repetir — corrigido ou confirmado ao longo do tempo).
- **topics** — assuntos recorrentes/projetos em andamento (estado, prazos,
  decisões, motivo por trás delas).
- **people** — outras pessoas mencionadas com frequência e o contexto
  sobre elas que é relevante pro trabalho.

Cada categoria tem sua própria lógica de "quando atualizar" — ver os
quatro templates de memória e, principalmente, `notas-de-design.md`, que
cobre o ponto mais difícil de acertar.

### 5. Coordenação assíncrona entre agentes independentes (opcional)
Só se aplica quando você tem **vários agentes que não compartilham
sessão**: disparados por cron/webhook em horários diferentes, que podem
rodar com horas ou dias de diferença e nunca conversam ao vivo. O par
orquestrador/subagente acima não cobre esse caso (ele assume que quem
delega espera a resposta na mesma janela de tempo). Aqui a coordenação
passa por estado durável — um canal de pedido/resposta, um log
append-only, uma tabela de status visível — em vez de chamada direta. Ver
`coordenacao-assincrona.md`.

### 6. Harness de confinamento (opcional, mas crítico pra agente sem revisão humana)
Novidade da v0.03 — se aplica a qualquer agente, dentro ou fora deste kit,
que age **sem aprovação humana antes de cada passo** (o caso típico de
agente em cron). As cinco peças acima organizam colaboração entre agentes;
esta organiza **o que impede dano além do pretendido mesmo se o prompt for
mal interpretado**: escopo travado por allow-list (não por instrução
verbal), canal de escalonamento no lugar de contorno quando o escopo
barra algo, gate de permissão por consequência real da ação (não pelo tipo
técnico de ferramenta usada), dado de ferramenta de monitoramento tratado
como não confiável, e recusa de classificador de segurança do provedor
tratada como categoria própria de falha. Ver `confinamento-harness.md`.

### 7. Gate de verificação antes de declarar sucesso (novo na v0.04)
As peças acima organizam colaboração e contenção; esta organiza **como
saber que uma rodada funcionou de verdade antes de reportá-la como
concluída** — problema que existe mesmo quando o agente faz exatamente o
que devia. O sinal mais fácil de checar (build passou, `curl` devolveu
200, arquivo existe com tamanho certo) quase sempre prova menos do que
parece: build não prova runtime, transporte não prova execução, arquivo
existir não prova que restaura. Três camadas (estrutural, transporte,
conteúdo/integridade) e uma regra de fechamento — reverter pro estado
anterior conhecido-bom e reportar como não entregue é sempre uma saída
válida quando a verificação falha, nunca motivo pra deixar algo quebrado
no ar por já ter sido trabalhoso chegar até ali. Ver
`verificacao-e-reversao.md`.

### 8. Eficiência de contexto pra rodada longa/repetida (novo na v0.05)
Se aplica a qualquer agente que roda repetidamente (cron diário, webhook
frequente) sobre um ambiente que só cresce — mais histórico, mais log, mais
arquivo. Sem um hábito deliberado, o custo de contexto por rodada sobe
junto com o tamanho do projeto, não com a dificuldade real da tarefa:
histórico relido do início em vez de por amostra recente, saída verbosa de
comando (`docker build`, `npm install`) entrando inteira no contexto,
releitura ritual do que a própria rodada acabou de escrever. Quatro hábitos
concretos, validados comparando uso de token antes/depois numa tabela de
status real. Ver `eficiencia-de-contexto.md`.

### 9. Sensor de estado por rodada (novo na v0.06)
Complementa a tabela de status de `coordenacao-assincrona.md` com algo
mais barato: um arquivo JSON pequeno, sobrescrito (não anexado) ao fim de
toda rodada de todo agente agendado, com três campos fixos — `shipped`
(entregou algo persistente ou só verificou?), `summary` (uma frase) e
`needs_input` (existe decisão humana pendente?). Não exige banco nem
rotação, e responde em menos de um segundo a pergunta "a última rodada
deste agente terminou bem, e ela precisa de mim?" pra três leitores
diferentes: a própria próxima rodada do agente, um humano olhando por
fora, ou outro processo do mesmo sistema. Ver `sensor-de-estado.md`.

### 10. Escalonamento pra humano é canal diferente de coordenação entre pares (novo na v0.07)
`coordenacao-assincrona.md` trata "canal de pedido/resposta" como uma peça
única, mas o comportamento certo muda dependendo de quem responde. Um
agente par vai reler o canal na própria rodada seguinte dele de qualquer
forma — canal durável simples basta, sem notificação ativa. Um humano não
tem "próxima rodada" nenhuma que o force a voltar olhar um arquivo —
canal durável sozinho não é suficiente; precisa ser pareado com uma
notificação ativa (chat, push, o que a pessoa de fato monitora) disparada
no instante em que o pedido é escrito. A assimetria vai no sentido
contrário também: a resposta do humano não tem notificação de volta — quem
escalou precisa continuar relendo o canal periodicamente até achar a
resposta, nunca assumir que vai ser avisado. Ver `escalonamento-humano.md`.

## Instalação por harness

### Claude Code
- **Orquestrador**: é a própria sessão principal. Coloque as regras de
  roteamento (quando responder direto vs delegar) no `CLAUDE.md` do
  projeto/usuário — ele é carregado sempre, no início de toda sessão.
- **Subagentes**: definidos como arquivos Markdown com frontmatter
  (`name`, `description`, ferramentas permitidas) numa pasta de agentes do
  projeto — a ferramenta de invocação de agente os lista automaticamente
  a partir daí. Um subagente por escopo, prompt no corpo do arquivo.
- **Skills**: arquivos `SKILL.md` com frontmatter (`name`, `description`)
  numa pasta de skills — descoberta automática por descrição, invocação
  explícita quando a tarefa bate com o skill.
- **Memória**: um diretório de memória com um arquivo índice (curto, uma
  linha por entrada) e um arquivo por memória individual, seguindo a
  separação de quatro categorias acima. Referencie o índice no `CLAUDE.md`
  pra ele ser carregado toda sessão; os arquivos individuais são lidos sob
  demanda quando relevantes.
- **Harness de confinamento**: usuário de sistema dedicado pro agente
  autônomo (sem acesso ao resto do host), escopo de diretório declarado em
  texto no próprio prompt do agente + reforçado por permissão de arquivo
  onde der, e um arquivo de escalonamento (ex. `NECESSIDADES.md`) referenciado
  explicitamente como única saída formal pra pedir algo fora do escopo —
  sempre pareado com notificação ativa quando quem responde é um humano
  (ver peça 10).
- **Sensor de estado**: um arquivo `.last-<agente>-run.json` na raiz do
  projeto, sobrescrito como último passo do prompt do agente agendado,
  antes de encerrar a rodada.

### OpenCode
OpenCode tem conceitos equivalentes (modos/agentes customizados,
configuração de sistema por projeto, execução headless via linha de
comando) mas o formato exato de configuração muda entre versões — confira
a documentação/`--help` da versão que você tem instalada antes de replicar
a estrutura acima literalmente. A ideia que se transporta sem mudança é a
separação de papéis: um processo/prompt "orquestrador" que decide rotear,
processos/prompts separados por escopo pra tarefas específicas, arquivos
de referência (skills) carregados sob demanda, um diretório de memória
persistente lido no início de cada rodada, e — pra qualquer execução sem
revisão humana — o confinamento por fora do prompt (usuário de sistema
restrito, allow-list de escopo).

### Qualquer outro harness / API crua
Sem suporte nativo a subagentes/skills, dá pra montar o padrão na mão:
- Orquestrador = seu loop principal, com um system prompt que inclui as
  regras de roteamento e o conteúdo do índice de memória.
- Subagente = uma chamada de API separada, com seu próprio system prompt
  estreito e sua própria janela de contexto (não reaproveite o histórico
  da conversa principal inteiro).
- Skill = um arquivo de texto injetado no prompt do subagente relevante
  antes de ele agir (busca simples por palavra-chave já resolve a maior
  parte dos casos; não precisa de embedding/RAG pra começar).
- Memória = os quatro arquivos de categoria, lidos no início da sessão e
  atualizados por um passo explícito (nunca "sempre que parecer relevante"
  sem critério — ver `notas-de-design.md`).
- Confinamento = processo rodando sob usuário de sistema sem acesso ao
  resto do host, escopo de escrita limitado por permissão de arquivo real
  (não só por instrução no prompt), canal de escalonamento durável.
- Sensor de estado = o mesmo arquivo `.last-<agente>-run.json`, escrito
  por qualquer linguagem/runtime como último passo do script/loop que
  chama o agente.

## Instalação/atualização automática

Em vez de baixar cada arquivo na mão, dá pra colar um prompt no seu
próprio agente de IA (Claude Code, OpenCode, qualquer harness que busque
URL e escreva arquivo local) e deixar ele buscar a versão mais recente,
baixar tudo e checar atualizações depois — ver `../install-prompt.md`
(um nível acima desta pasta, fora do versionamento, porque serve pra
qualquer versão). Ele lê `../latest.json` primeiro pra saber a versão
atual antes de baixar qualquer coisa, então funciona tanto pra primeira
instalação quanto pra atualização.

## Arquivos deste kit
- `orquestrador-prompt.md` — template de prompt de sistema do orquestrador
- `subagente-template.md` — esqueleto de definição de subagente
- `skill-template.md` — exemplo de skill de referência
- `memoria-profile.md`, `memoria-preferences.md`, `memoria-topics.md`,
  `memoria-people.md` — templates das quatro categorias de memória
- `notas-de-design.md` — o ponto mais difícil: quando escrever memória e
  quando delegar pra um subagente
- `coordenacao-assincrona.md` — padrão pra agentes independentes que não
  compartilham sessão (cron, sem espera de resposta ao vivo)
- `confinamento-harness.md` — escopo travado, canal de escalonamento, gate
  de permissão por consequência, dado de monitoramento como não confiável,
  recusa de classificador de segurança como categoria própria de falha
- `verificacao-e-reversao.md` — gate de verificação (estrutural,
  transporte, conteúdo/integridade) antes de declarar sucesso, com
  reversão como saída válida quando a verificação falha
- `eficiencia-de-contexto.md` — quatro hábitos pra conter o custo de
  contexto de um agente que roda repetidamente sobre um ambiente que só
  cresce (histórico por amostra, truncar saída verbosa, resolver mais por
  chamada, não reler o que acabou de escrever)
- `sensor-de-estado.md` — arquivo JSON sobrescrito a cada rodada
  (`shipped`/`summary`/`needs_input`), mais barato que a tabela de status
  pra responder rápido se a última rodada entregou algo e se precisa de
  decisão humana
- `escalonamento-humano.md` — novo na v0.07: por que o canal de
  pedido/resposta precisa de notificação ativa quando quem responde é um
  humano, e não precisa quando é outro agente — e a assimetria que isso
  cria na forma de ler a resposta de volta
