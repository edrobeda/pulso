# Template: eficiência de contexto pra agente de rodada longa/repetida (iaBrain v0.05)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## Por que isso é uma peça separada

As peças anteriores do kit organizam colaboração (orquestrador/subagentes),
coordenação entre agentes independentes, confinamento e verificação. Nenhuma
delas resolve um problema que só aparece com o tempo: um agente que roda
repetidamente (cron diário, webhook frequente) sobre um ambiente que só
cresce — mais histórico, mais arquivos, mais linhas de log — paga um custo
de contexto maior a cada rodada, mesmo fazendo exatamente a mesma tarefa.
Sem um hábito deliberado de conter isso, o consumo de token por rodada sobe
junto com o tamanho do projeto, não com a dificuldade real da tarefa — e
ninguém decidiu isso de propósito, só aconteceu.

Esse problema foi medido, não hipotético: um agente autônomo registrando o
próprio uso de token por rodada (mesmo padrão descrito em
`coordenacao-assincrona.md`, peça 3 — tabela de status visível) viu
`cache_read_tokens` passar de 1-2 milhões por execução ainda num projeto
pequeno, antes de qualquer ajuste de hábito. O ajuste reduziu esse número
sem reduzir a qualidade do trabalho entregue — o alvo é cortar exploração
redundante, não fazer menos.

## Os quatro hábitos

### 1. Leia histórico por amostra recente, não o artefato inteiro

Um changelog, um log de execução, uma tabela de eventos — qualquer coisa
que só cresce — não precisa ser relido do início a cada rodada pra saber
"o que já aconteceu". As últimas N entradas (`tail -n 20` num arquivo,
`ORDER BY data DESC LIMIT 5` numa query) quase sempre bastam pra saber o
que mudou desde a última vez. Releitura do histórico inteiro é o mesmo tipo
de desperdício descrito em `notas-de-design.md` pra memória que ninguém
consulta de verdade — aqui o alvo é o próprio agente relendo o que ele
mesmo já escreveu em rodadas passadas.

Exceção deliberada: se a tarefa da rodada é, ela mesma, uma auditoria sobre
o histórico completo (ex. uma catalogação que precisa garantir que nada foi
duplicado), leia o arquivo inteiro — a regra é "amostra por padrão", não
"nunca leia tudo".

### 2. Trunque saída verbosa de comando antes dela entrar no seu próprio contexto

`docker compose build`, `npm install`, `terraform plan` e comandos
parecidos imprimem muito mais do que qualquer decisão precisa. Encadeie
`tail -n 30-40` (ou `grep -i error`) na própria chamada, em vez de deixar o
log inteiro ser lido por você e reenviado via cache nos passos seguintes da
mesma rodada. Só peça o log completo quando o comando falhar — nesse caso,
o volume extra paga por si, porque é exatamente o que falta pra
diagnosticar.

### 3. Resolva mais por chamada de ferramenta, em vez de ida e volta repetida

Quando o próximo passo já é previsível a partir do que você sabe agora, não
quebre em várias chamadas sequenciais só pra "confirmar de novo" — isso
multiplica contexto reenviado sem multiplicar informação nova. Paralelize
leituras/consultas independentes numa única rodada de chamadas quando a
ferramenta permitir, e planeje dois ou três passos adiante antes de agir,
em vez de reagir um passo por vez.

### 4. Não releia o que você acabou de escrever só pra confirmar

Se uma ferramenta de escrita (editar arquivo, gravar linha em tabela) não
retornou erro, ela funcionou — reler o resultado imediatamente depois só
pra "ter certeza" é gasto de contexto sem ganho de informação, porque a
única fonte de verdade sobre se a escrita aconteceu já é o retorno da
própria chamada. Releia só se for usar o conteúdo lido pra uma decisão
seguinte de verdade (ex.: conferir um valor calculado por outra parte do
sistema), não como checagem ritual.

## Como saber que funcionou

Hábito sem medição é opinião. Se o seu agente já registra uso de token por
rodada (ver `coordenacao-assincrona.md` pra o padrão de tabela de status
visível), compare o número de antes e depois de adotar estes hábitos nas
próprias rodadas seguintes — não assuma que "parece mais eficiente" sem
olhar o dado. Se não existe esse registro ainda, criar um é pré-requisito
pra validar qualquer mudança aqui, não só pra este padrão específico.

## Checklist rápido

- [ ] Toda releitura de histórico (changelog, log, tabela de eventos) usa
      uma janela recente (`tail`/`LIMIT`) por padrão, com leitura completa
      reservada só pra quando a própria tarefa é auditar o histórico todo.
- [ ] Saída de comando verboso é truncada antes de entrar no contexto,
      exceto quando o comando falha.
- [ ] Passos previsíveis em sequência são resolvidos numa chamada maior ou
      em paralelo, não em ida-e-volta repetida.
- [ ] Nenhuma releitura de arquivo/linha recém-escrita só pra confirmação
      ritual, sem uma decisão real dependendo do conteúdo lido.
- [ ] Existe algum registro de uso de token por rodada pra validar que a
      mudança de hábito teve efeito real, não só teórico.

## Lição de origem

Prática já em uso pelos três agentes autônomos deste projeto (publicação,
infraestrutura, este catálogo), adotada depois de um pedido explícito de
redução de custo por rodada e validada comparando o histórico de uso de
token antes e depois — nunca tinha virado peça reaproveitável do kit em si,
só uma menção pontual dentro de `coordenacao-assincrona.md`.
