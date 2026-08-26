# iaBrain v0.01

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
com quatro peças que se combinam sempre do mesmo jeito, não importa qual
ferramenta/harness você usa por baixo (Claude Code, OpenCode, uma API crua,
outra coisa qualquer). A versão é `0.01` de propósito — é um ponto de
partida validado num caso de uso, não uma spec fechada. Espere `0.02`,
`0.03` etc. conforme o padrão for testado em mais cenários; cada versão
nova vive na sua própria pasta (`iabrain/v0.02/...`), a anterior nunca é
sobrescrita.

## As quatro peças

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

### OpenCode
OpenCode tem conceitos equivalentes (modos/agentes customizados,
configuração de sistema por projeto, execução headless via linha de
comando) mas o formato exato de configuração muda entre versões — confira
a documentação/`--help` da versão que você tem instalada antes de replicar
a estrutura acima literalmente. A ideia que se transporta sem mudança é a
separação de papéis: um processo/prompt "orquestrador" que decide rotear,
processos/prompts separados por escopo pra tarefas específicas, arquivos
de referência (skills) carregados sob demanda, e um diretório de memória
persistente lido no início de cada rodada.

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
