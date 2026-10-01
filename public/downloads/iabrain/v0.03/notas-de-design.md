# Notas de design (iaBrain v0.01): o ponto mais difícil

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## Por que este arquivo existe

A arquitetura em si (orquestrador → subagentes, skills como referência,
memória em quatro categorias) não é a parte difícil — é só estrutura.
O que realmente precisa de iteração, na prática, é o **roteamento**: duas
decisões que parecem simples e não são.

## Decisão 1: quando escrever memória

O erro mais comum não é esquecer de gravar algo importante — é gravar
coisa **efêmera** que não deveria ter virado memória permanente. Sintomas
de que sua lógica de gravação está gravando demais:
- Memórias que descrevem o estado de uma tarefa específica, não um padrão
  reutilizável ("terminei de editar o arquivo X" não é memória).
- Memórias que ninguém nunca mais consulta — se em semanas de uso uma
  categoria inteira nunca influenciou uma resposta, o critério de gravação
  dela está frouxo demais.
- Duplicação: a mesma informação registrada de formas ligeiramente
  diferentes em entradas separadas, porque não houve checagem se já
  existia antes de gravar de novo.

**Heurística que funciona na prática**: pergunte "isso teria valor numa
conversa daqui a um mês, sem o contexto desta conversa específica?". Se a
resposta depender de detalhes desta sessão pra fazer sentido, não é
memória — é contexto de sessão, e contexto de sessão não precisa ser
persistido.

O oposto também é um erro: só registrar correções (quando algo deu
errado) e nunca confirmações (quando uma escolha não-óbvia foi validada)
faz o sistema ficar cada vez mais conservador com o tempo, sem nunca
"aprender" que uma abordagem incomum já foi aceita antes.

## Decisão 2: quando delegar pra um subagente vs resolver direto

Coordenação não é grátis — montar o prompt do subagente, esperar o
retorno, sintetizar de volta consome tempo e, em muitos harnesses, tokens
extras (o subagente não compartilha o contexto já acumulado, então parte
de um contexto "frio"). Delegar por padrão, achando que é "mais seguro" ou
"mais robusto", é um erro de custo invisível — some devagar, mas some.

**Sinais de que vale delegar**:
- A tarefa precisa de uma ferramenta/acesso que só aquele subagente tem.
- A tarefa é grande o bastante que isolá-la evita poluir a conversa
  principal com passos intermediários (buscas, tentativas, raciocínio de
  meio de caminho que ninguém precisa ver).
- Existem frentes genuinamente independentes — nesse caso, delegar em
  paralelo é estritamente melhor que resolver tudo sequencialmente na
  conversa principal.

**Sinais de que NÃO vale delegar**:
- A tarefa é pequena o bastante que o overhead de coordenação custa mais
  que resolvê-la direto.
- O orquestrador já tem tudo que precisa em contexto/memória — delegar
  aqui só adiciona uma volta desnecessária.
- A tarefa depende fortemente do histórico específico desta conversa, que
  o subagente não teria (a menos que você reconstrua esse histórico no
  prompt de delegação, o que geralmente não compensa pra tarefas
  pequenas).

## Não existe fórmula fixa

As duas decisões acima dependem do harness, do custo de coordenação
específico dele, e do domínio da tarefa — não existe um limiar universal
("delegue sempre que a tarefa tiver mais de N passos"). O que existe é um
processo: comece com um critério simples, observe onde ele erra na
prática (memória cheia de lixo? subagentes acionados pra tarefas triviais?
subagentes que deveriam ter sido acionados e não foram?), e ajuste. Esse
ajuste iterativo é o motivo desse kit ser versionado — espere reescrever
esta seção específica mais do que qualquer outro arquivo do kit conforme
você testa contra o seu próprio uso real.
