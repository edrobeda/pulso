# Necessidades

Este arquivo é o canal do agente de infraestrutura do Pulso (roda 1x/dia,
18:00 horário de Brasília) para pedir algo ao Edson — uma chave, uma
decisão, um acesso — sempre que precisar de algo que não pode resolver
sozinho dentro do escopo de `/home/blog-bot/blog`.

**Como funciona:**
1. Quando o agente precisa de algo, adiciona uma entrada nova no TOPO desta
   lista (formato abaixo) e manda um aviso por WhatsApp.
2. O Edson responde **editando este arquivo diretamente**, preenchendo a
   linha "Resposta do Edson" da entrada correspondente.
3. Na rodada seguinte, o agente relê o arquivo inteiro. Se encontrar uma
   resposta preenchida, processa (ex.: move credencial para `.env` com
   permissão 600) e marca a entrada como `[RESOLVIDO]`. Se a resposta trouxe
   um segredo, o valor bruto é apagado deste arquivo depois de consumido —
   este `.md` não deve reter chaves em texto puro por muito tempo.
4. Antes de abrir um pedido novo, o agente sempre confere se já não existe
   um pedido `[PENDENTE]` equivalente, pra não duplicar.

**Formato de cada entrada:**

```markdown
## AAAA-MM-DD — [PENDENTE] título curto do pedido
**Por quê:** contexto de por que isso é necessário.
**O que preciso:** exatamente o que teria que vir na resposta (uma chave? um sim/não? uma escolha entre opções?).
**Resposta do Edson:** _(preencha aqui embaixo desta linha)_
```

---

## 2026-08-02 — [PENDENTE] Edson pede: proteger main/master, exigir PR (auto aceito)
**Por quê:** ideia do Edson, não pedido seu — ele quer que nenhuma alteração
entre direto na `main` do repo do Pulso (`git@github.com-pulso:edrobeda/pulso.git`),
nem a sua nem de qualquer outra edição futura. Toda mudança deve passar por
pull request antes de mesclar, mesmo que o PR seja aceito automaticamente
(sem review humana travando o fluxo) — o objetivo é ter sempre um diff
revisável registrado no histórico, não bloquear a velocidade do agente.
**O que preciso:** não é uma pergunta pra você responder — é uma tarefa pra
implementar na sua próxima rodada. Configure branch protection na `main` do
repo `edrobeda/pulso` no GitHub (via `gh api` ou `gh repo edit`/`gh ruleset`)
exigindo que toda alteração entre via pull request — mas com merge
automático liberado (auto-merge, sem exigência de aprovação humana
bloqueando, sem status checks obrigatórios que você mesmo não consiga
satisfazer). Ajuste também o seu próprio fluxo (e o do agente de publicação,
se ele também commitar direto na `main` hoje — registre em `MEETING.md` pra
ele se for território dele) pra criar branch + PR + merge automático em vez
de dar push direto na `main`. Use seu critério técnico pra decidir a melhor
forma de implementar. Se em algum momento isso quebrar o fluxo diário (ex.:
merge automático falhar e a `main` ficar sem atualizar), registre aqui os
motivos e o que faltou em vez de forçar um jeito inseguro de contornar.
**Resposta do Edson:** Sim, implementa. Sem prazo, faz do jeito que achar
mais limpo.

---

## 2026-08-01 — [PENDENTE] Edson pede: registrar tokens usados por rodada
**Por quê:** ideia do Edson, não pedido seu — ele quer que fique visível
(em `/bastidores`) quanto custo/trabalho real cada rodada consumiu, pra
reforçar que é um agente de verdade fazendo o trabalho, não um script fixo
ou algo simulado.
**O que preciso:** não é uma pergunta pra você responder — é uma tarefa pra
implementar na sua próxima rodada. Dica técnica: `claude -p ... --output-format json`
(ou `stream-json`) devolve, no objeto final, um campo `usage` com
`input_tokens`/`output_tokens`/tokens de cache, além de custo em dólar. Você
tem liberdade pra decidir a melhor forma de capturar isso na sua própria
rodada (`infra-agent.sh` e `notify-infra.sh` não são território do agente
de publicação, pode mexer neles) e expor no `backlog_entries`/`/bastidores`
— use seu critério de engenharia pra decidir se guarda como coluna nova em
`backlog_entries`, tabela separada, etc. Se decidir que faz sentido
estender a mesma ideia pros posts do agente de publicação (tokens por
post), registre isso como pedido seu em `MEETING.md` pra ele, não tente
implementar você mesmo (território dele).
**Resposta do Edson:** Sim, implementa. Sem prazo, faz do jeito que achar
mais limpo.

---

*Nenhum outro pedido em aberto no momento.*
