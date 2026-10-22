# Changelog — iaBrain

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. O autor não se responsabiliza por qualquer dano ou mau
> funcionamento decorrente do uso deste conteúdo.

## v0.06 — 2026-10-22

Revisão semanal do kit (produto, não reação a bug isolado). Adiciona uma
nona peça: `sensor-de-estado.md` — um arquivo JSON pequeno (`shipped`,
`summary`, `needs_input`), sobrescrito ao fim de toda rodada de agente
agendado, em vez de anexado. Complementa a tabela de status de
`coordenacao-assincrona.md` com algo mais barato (sem banco, sem rotação)
pra responder rápido "a última rodada terminou bem, e precisa de mim?"
pra três leitores — a próxima rodada do mesmo agente, um humano olhando
por fora, ou outro processo do sistema. Motivado por uso real: os três
agentes autônomos deste blog já escrevem um `.last-<agente>-run.json`
dessa forma a cada rodada há semanas, mas o padrão nunca tinha virado
peça reaproveitável do kit em si — só existia espalhado na prática de
cada agente. Os demais arquivos da v0.05 seguem idênticos nesta versão.

## v0.05 — 2026-10-15

Revisão semanal do kit (produto, não reação a bug isolado). Adiciona uma
oitava peça: `eficiencia-de-contexto.md`, quatro hábitos pra conter o
custo de contexto de um agente que roda repetidamente (cron/webhook) sobre
um ambiente que só cresce — ler histórico por amostra recente em vez do
artefato inteiro, truncar saída verbosa de comando antes dela entrar no
contexto, resolver mais por chamada de ferramenta em vez de ida e volta
repetida, e não reler o que a própria rodada acabou de escrever só pra
confirmação ritual. Motivado por uso real e já medido: os três agentes
autônomos deste blog adotaram esses hábitos depois de um pedido explícito
de redução de custo por rodada (registrado em `cache_read_tokens` numa
tabela de uso própria) e o padrão só existia, até aqui, como uma menção
pontual dentro de `coordenacao-assincrona.md` — nunca tinha virado peça
reaproveitável do kit em si. Os demais arquivos da v0.04 seguem idênticos
nesta versão.

## v0.04 — 2026-10-08

Revisão semanal do kit (produto, não reação a bug). Adiciona uma sétima
peça: `verificacao-e-reversao.md`, um gate de verificação (estrutural,
transporte, conteúdo/integridade) antes de declarar uma rodada concluída,
com reversão pro estado anterior conhecido-bom como saída válida quando a
verificação falha. Motivado por uso real: os três agentes autônomos deste
blog já seguem exatamente esse ritual ("testar antes de subir", reverter
e marcar como não entregue se algo falhar) toda rodada, e esse padrão
nunca tinha virado peça reaproveitável do kit — diferente do harness de
confinamento (v0.03), que impede dano além do pretendido, esta peça
resolve "como saber que o que foi feito funcionou de verdade" mesmo
quando o agente faz exatamente o que devia. Os demais arquivos da v0.03
seguem idênticos nesta versão.

Histórico de versões do kit. Cada versão vive na sua própria pasta
(`v0.01/`, `v0.02/`...) — uma versão nova nunca sobrescreve a anterior.
`latest.json` na raiz sempre aponta pra versão mais recente.

## v0.03 — 2026-10-01

Revisão semanal do kit (produto, não reação a bug isolado). Adiciona uma
sexta peça opcional: `confinamento-harness.md`, um template que reúne o
que falta nas peças anteriores — elas organizam colaboração entre
agentes, mas nenhuma cobria o que impede dano além do pretendido quando
um agente age sem revisão humana antes de cada passo. Junta quatro
padrões já extraídos como lições isoladas no catálogo `/laboratorio` deste
mesmo repositório (escopo travado por allow-list, canal de escalonamento
no lugar de contorno, gate de permissão por consequência real em vez de
tipo de ferramenta, dado de monitoramento/segurança como não confiável,
recusa de classificador de segurança do provedor como categoria própria
de falha) numa única peça reaproveitável do kit — motivado pelo fato de
este padrão já ser, literalmente, como os três agentes autônomos deste
blog são construídos, mas nunca tinha virado template explícito. Os
demais arquivos da v0.02 seguem idênticos nesta versão.

## v0.02 — 2026-09-24

Revisão semanal do kit (produto, não reação a bug). Adiciona uma quinta
peça opcional: `coordenacao-assincrona.md`, um padrão pra agentes
independentes que não compartilham sessão (disparados por cron, sem
espera de resposta ao vivo) coordenarem via estado durável — canal de
pedido/resposta, log append-only, tabela de status visível — em vez do
par orquestrador/subagente, que assume delegação síncrona. Motivado pelo
próprio uso real: os três agentes autônomos deste blog (publicação,
infraestrutura, este catálogo) já coordenam exatamente assim há semanas
e esse padrão nunca tinha virado peça reaproveitável do kit. Os demais
arquivos da v0.01 seguem idênticos nesta versão.

## v0.01 — 2026-08-26

Versão inicial. Quatro peças (orquestrador, subagentes, skills, memória em
quatro categorias: profile/preferences/topics/people), com instruções de
instalação por harness (Claude Code, OpenCode, genérico) e notas de design
sobre o ponto mais difícil: quando gravar memória e quando delegar.
