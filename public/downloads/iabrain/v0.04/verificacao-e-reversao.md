# Template: gate de verificação antes de declarar sucesso (iaBrain v0.04)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## Por que isso é uma peça separada

O harness de confinamento (`confinamento-harness.md`) resolve "o que
impede o agente de causar dano além do pretendido". Esta peça resolve um
problema diferente, que acontece mesmo quando o agente faz exatamente o
que devia: **como ele sabe que o que fez funcionou de verdade antes de
reportar a rodada como concluída?** Um agente sem revisão humana antes de
agir também não tem revisão humana depois — se ele próprio não verificar
de forma confiável, ninguém verifica até um usuário real tropeçar no
problema.

## O erro raiz: aceitar o sinal mais fácil de checar, não o mais verdadeiro

Todo ambiente oferece um sinal de sucesso barato de checar — o comando
terminou sem erro, o build passou, o `curl` devolveu 200 — e esse sinal
quase sempre prova menos do que parece. Build passar não prova que todo
import tem arquivo correspondente copiado pra imagem. HTTP 200 não prova
que o JavaScript executa sem erro. Um arquivo de backup existir com o
tamanho certo não prova que ele restaura. Nenhum desses sinais está
"errado" — cada um prova uma coisa real, só que uma camada mais superficial
do que "a tarefa foi cumprida".

## As três camadas (nem toda tarefa precisa das três, mas toda tarefa deveria passar por esta pergunta)

### 1. Gate estrutural (determinístico, rápido)

Build/lint/teste automatizado — pega erro de sintaxe, import ausente,
regressão coberta por teste. Rode sempre, é barato, mas não para aqui:
estrutural correto não é o mesmo que comportamento correto.

### 2. Gate de transporte (a camada mais enganosa de todas)

`curl`/healthcheck HTTP confirma que o serviço responde — mas só prova
transporte, não execução nem conteúdo. Depois de qualquer mudança que
toque execução no cliente (JavaScript, render), o gate de transporte
precisa ser complementado por uma checagem que de fato execute o
resultado (browser headless real, checagem de erro de console/exceção em
runtime) antes de confiar no 200. E sempre confira a URL específica que a
mudança tocou — não só a rota raiz; um módulo novo, um arquivo novo
baixável, uma rota nova precisam do próprio `curl`/teste, porque "o site
no geral está de pé" não prova que a peça nova específica está.

### 3. Gate de conteúdo/integridade (quando a tarefa produz dado, não só serve página)

Pra backup, migração, geração de arquivo: o arquivo existir com tamanho
plausível e passar teste de integridade do próprio formato (`gzip -t`,
`tar -tzf`) é necessário, mas só a restauração real (destino descartável,
comparação de um sinal de saúde simples) prova que o conteúdo é
utilizável — não só bem formado.

## A regra que fecha o ciclo: reverter é sempre uma saída válida

Se a verificação falhar e o agente não conseguir corrigir com confiança
dentro da própria rodada, a ação certa é **reverter pro estado anterior
conhecido-bom e reportar a rodada como não entregue** — nunca deixar o
resultado quebrado no ar só porque já foi trabalhoso chegar até ali, e
nunca reportar sucesso por otimismo ("provavelmente está certo"). Isso só
funciona se existir um estado anterior fácil de restaurar (controle de
versão, backup do arquivo antes de editar) — projete a reversão como
parte do plano antes de agir, não como algo a inventar na hora em que já
deu errado.

## Isso precisa ser visível, não só verdadeiro

Uma verificação que passa ou falha só dentro de um processo que nenhum
humano olha equivale a não ter verificação (ver
`coordenacao-assincrona.md` deste mesmo kit, peça 3 — tabela de status
visível). Uma rodada que reverteu e não entregou nada **ainda precisa**
aparecer no histórico/status como tal — "tentei, verifiquei, falhou,
revertido" é informação real; silêncio não é.

## Checklist rápido

- [ ] Depois de qualquer gate estrutural (build/lint/teste) passar, existe
      pelo menos um gate de transporte real contra a URL/caminho
      específico que a mudança tocou — não só a raiz do serviço.
- [ ] Se a mudança envolve execução no cliente (JS/render), o gate de
      transporte é complementado por checagem de execução real (browser
      real, não só `curl`), ou está documentado por que isso não se
      aplica.
- [ ] Se a tarefa produz um arquivo/dado persistido, existe teste de
      integridade de formato E, quando praticável, uma restauração real
      pra destino descartável.
- [ ] Existe um caminho de reversão conhecido e rápido (git, backup de
      arquivo) antes de agir, não inventado depois que algo já falhou.
- [ ] O resultado da rodada (entregue ou revertido) é registrado em algum
      lugar visível por um humano — nunca só no log local do processo.

## Lições de origem (catálogo `/laboratorio` deste mesmo repositório)

`http-200-nao-e-validacao`, `dockerfile-copy-nao-acompanha-modulo-novo`,
`proxy-guarda-ip-antigo-do-container`, `backup-sem-verificacao-nao-e-backup`,
`integridade-de-arquivo-nao-prova-restore`,
`verificacao-que-so-o-processo-ve`.
