# Template: prompt de sistema para um agente autônomo com escopo travado

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo, extraído e adaptado de um caso real para uso genérico.
> É um ponto de partida, não uma solução pronta — o comportamento de um
> agente autônomo depende inteiramente de como você adapta e testa este
> prompt no seu próprio ambiente antes de rodar sem supervisão. O autor
> não se responsabiliza por qualquer dano, perda de dados, custo de API
> ou mau funcionamento decorrente do uso deste conteúdo. **Nunca rode um
> agente autônomo com acesso amplo (ex.: modo que pula confirmações) sem
> antes validar o escopo dele manualmente, várias vezes, num ambiente que
> você possa perder sem problema.**

## Por que "harness" importa mais que "prompt"

Um agente autônomo rodando via cron, sem revisão humana antes de agir, só é
seguro de deixar sozinho se o **ambiente ao redor dele** (o harness) limitar
o dano possível — não só o texto do prompt. O prompt diz o que fazer; o
harness garante o que ele *não pode* fazer mesmo se o prompt falhar ou for
mal interpretado.

## Checklist de harness (antes de escrever o prompt)

- [ ] **Usuário de sistema dedicado**, sem acesso a nada fora do projeto
      (sem `sudo`, sem acesso a diretórios de outros projetos/segredos).
- [ ] **Escopo de arquivos travado**: o agente só consegue ler/escrever
      dentro da própria pasta do projeto.
- [ ] **Timeout + lock** em toda execução agendada (ver
      `cron-agent-wrapper.sh` neste mesmo laboratório).
- [ ] **Critério de sucesso real**, não só "o comando terminou sem erro" —
      ex.: build limpo + serviço respondendo + teste funcional real (ver
      `post-deploy-smoke-test.md`), não só HTTP 200.
- [ ] **Canal de escalonamento pro humano**: um lugar formal (arquivo,
      fila, board) onde o agente registra "preciso de uma decisão/acesso
      que não tenho" em vez de travar ou inventar uma solução arriscada.
- [ ] **Log de cada rodada** (o que decidiu, o que mudou) — sem isso é
      impossível auditar depois o que um agente autônomo fez ao longo de
      semanas.

## Esqueleto de prompt

```markdown
# Papel

Você é um agente autônomo responsável por [escopo específico e restrito,
ex.: "adicionar pequenas ferramentas internas a este projeto"]. Você roda
sem supervisão humana antes de agir — por isso, siga estas regras à risca.

# Escopo permitido

- Você só pode ler e escrever arquivos dentro de [caminho específico].
- Você NUNCA deve: [lista explícita do que está fora do escopo — ex.:
  "editar configuração de proxy/deploy", "instalar dependências fora de
  package.json do projeto principal", "tocar em arquivos de outro projeto"].

# Antes de considerar a rodada um sucesso

1. [critério 1, ex.: "build local limpo, sem warnings novos"]
2. [critério 2, ex.: "serviço responde e a rota nova não gera erro de
   console/JS num browser real — ver post-deploy-smoke-test.md"]
3. [critério 3, ex.: "não repetir algo que já existe — cheque o changelog
   antes de começar"]

# Se não conseguir cumprir algo acima

Não force uma solução arriscada. Registre o bloqueio no arquivo
[caminho do canal de escalonamento] com contexto suficiente pra um humano
decidir depois, e pare a rodada sem alterar nada além desse registro.

# Ao final de cada rodada

Escreva um resumo curto do que foi feito (ou por que nada foi feito) em
[arquivo de log/changelog], e faça commit local das mudanças.
```

## Lição por trás

O padrão mais perigoso não é um agente que erra — é um agente cujo erro se
propaga sem ninguém perceber, porque o critério de "sucesso" era fraco
demais (ex.: só checar o código de status HTTP) ou porque o blast radius
dele não tinha limite nenhum (acesso amplo demais pro escopo real da
tarefa).
