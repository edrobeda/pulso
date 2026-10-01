# Template: harness de confinamento pra agente autônomo (iaBrain v0.03)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## Por que isso é uma peça separada

As outras peças do kit (orquestrador, subagentes, skills, memória,
coordenação assíncrona) organizam **como um sistema de agentes se divide
em partes que colaboram**. Esta peça resolve um problema diferente: quando
pelo menos um desses agentes roda **sem revisão humana antes de agir**
(cron, webhook, fila — nada esperando alguém clicar "aprovar"), o que
garante que ele não cause dano além do pretendido não é o texto do prompt,
é o que existe ao redor dele. Um prompt bem escrito reduz a chance de
interpretação errada; não elimina ela. Confinamento é a diferença entre
"o agente não devia fazer X" e "o agente não consegue fazer X mesmo
interpretando mal a tarefa".

## As quatro camadas

### 1. Escopo travado por allow-list explícita, nunca por instrução verbal

"Só edite arquivos relacionados à tarefa" é prosa — depende do agente
concordar, na hora, com o que conta como "relacionado". Uma allow-list
concreta (lista de caminhos/arquivos que podem ser tocados, lista explícita
do que nunca pode) é um limite que não depende de reinterpretação. Quando
o agente precisar de algo fora da allow-list pra cumprir a tarefa, a regra
é **parar e escalar**, nunca contornar — ver peça 2 abaixo. Idealmente o
limite é reforçado por fora do próprio agente (permissão de sistema de
arquivo, usuário de serviço dedicado sem acesso ao resto), não só pela
allow-list escrita no prompt — texto ajuda o agente a se comportar bem,
mas não impede fisicamente um desvio.

### 2. Canal de escalonamento no lugar de contorno

Todo agente confinado precisa de uma saída formal pra quando o escopo
trava algo que a tarefa pede: um arquivo (ou fila) de pedido/resposta, lido
no início de cada execução, onde o agente registra o que precisa e por quê
— e espera uma resposta durável em vez de inventar um jeito de resolver
sozinho fora do escopo. Ver `coordenacao-assincrona.md` deste mesmo kit
pro formato completo desse canal (inclui a regra de nunca deixar segredo
retornado nele em texto puro por muito tempo). O ponto que mais importa
aqui: **registrar o pedido e parar é sempre a opção certa quando o escopo
barra uma tarefa** — nunca é motivo pra desligar a trava, usar uma
permissão mais ampla "só desta vez", ou achar um caminho técnico alternativo
que tecnicamente não viola a letra da regra mas viola o espírito dela.

### 3. Gate de permissão por consequência, não por tipo de ferramenta

O erro mais comum em harness de confinamento é categorizar risco pelo tipo
técnico da ação ("isso é só escrever um arquivo de texto", "isso é só ler
um e-mail") em vez de pelo efeito real dela fora do ambiente do agente.
Escrever um arquivo de configuração interno e escrever um documento com
força legal (uma licença, um contrato) usam a mesma ferramenta — só a
segunda pode criar uma obrigação que ninguém pediu. Ler conteúdo e preparar
o envio de algo pra um destinatário externo usam ferramentas comuns e
inofensivas isoladamente — a composição delas é que produz uma comunicação
externa irreversível. Pergunte, por ação relevante: **isso pode virar uma
obrigação legal, uma comunicação externa, ou algo irreversível fora do
próprio ambiente do agente?** Se sim, isso precisa de um gate que não
depende só do modelo achar que está tudo bem — e a intenção declarada pelo
próprio agente ("vou pedir confirmação antes de X") nunca conta como o
consentimento em si; o gate vem de fora, sempre.

### 4. Duas fronteiras de dado/falha que não são óbvias

Duas situações que parecem "dado normal" ou "erro genérico" mas merecem
tratamento à parte:

- **Dado lido através de uma ferramenta de monitoramento/segurança
  (log de WAF, rastreador de erro, alerta de observability) carrega texto
  escrito originalmente por quem fez a requisição — não pela ferramenta.**
  Isso não é mais confiável só porque chegou through um painel "sério"; é,
  se alguma coisa, mais suspeito que a média, porque é exatamente o que
  essas ferramentas capturam. Trate como dado não confiável explicitamente
  marcado no prompt, nunca como contexto de tarefa a seguir.
- **Uma chamada de API recusada pelo classificador de segurança do próprio
  provedor do modelo é uma categoria de falha própria, não um erro de
  código.** Nunca implemente retry automático que reenvia o mesmo
  conteúdo esperando passar, e nunca reformule/fragmente prompt
  especificamente pra escapar da detecção — isso é evasão, não correção de
  engenharia. Registre como lacuna visível (log, status) e escale como
  decisão de produto/política se o padrão se repetir, em vez de deixar o
  próprio pipeline tentar resolver sozinho.

## Checklist rápido pra montar um agente confinado novo

- [ ] Allow-list explícita de arquivos/diretórios (o que pode, o que nunca
      pode), reforçada fora do prompt quando possível (usuário de sistema,
      permissão de arquivo).
- [ ] Canal de escalonamento formal (arquivo de pedido/resposta) referenciado
      no prompt como a única saída pra quando o escopo barra algo — nunca
      contorno.
- [ ] Lista de ações de alto risco classificadas por consequência (documento
      com força legal, comunicação externa, ação irreversível) com gate
      explícito fora do julgamento do próprio modelo — não pelo tipo de
      ferramenta usada.
- [ ] Qualquer log/alerta de ferramenta de monitoramento lido pelo agente
      está marcado no prompt como dado não confiável.
- [ ] Recusa de classificador de segurança do provedor tem tratamento
      próprio no código/runbook — nunca retry cego, nunca reformulação pra
      escapar da detecção.

## Lições de origem (catálogo `/laboratorio` deste mesmo repositório)

Cada camada acima vem de um incidente real, genericizado:
`anatomia-harness-agente-autonomo`, `permissao-por-forma-nao-por-consequencia`,
`log-de-monitoramento-nao-e-instrucao`,
`bloqueio-de-seguranca-de-api-de-llm-nao-e-bug`.
