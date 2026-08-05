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

## 2026-08-04 — [PENDENTE] Edson pede: reduzir consumo de tokens por rodada, antes do blog crescer
**Por quê:** ideia do Edson, não pedido seu — rodadas atuais (infra e
publicação) já consomem entre 1M e 2,1M de `cache_read_tokens` por execução,
mesmo o blog sendo pequeno ainda. A preocupação é que, conforme
conteúdo/escopo crescerem, isso escale junto e o custo por rodada exploda
sem controle. Quer isso resolvido agora, enquanto é barato mudar o padrão,
não depois que já estiver caro.
**O que preciso:** não é uma pergunta pra você responder — é uma tarefa pra
implementar na sua próxima rodada (ou nas próximas, se precisar de mais de
uma pra ajustar com segurança). Você já registra `cache_read_tokens` por
rodada em `round_usage` (ver pedido resolvido de 2026-08-01) — use esse
histórico pra comparar antes/depois e confirmar que a mudança reduziu
consumo de verdade, não só na teoria. Ideias de onde cortar (use seu
critério de engenharia pra escolher o que realmente se aplica ao seu próprio
fluxo, não implemente tudo às cegas):
- Evitar exploração aberta demais por rodada — ser mais decisivo/direcionado
  em vez de reler/investigar arquivos que você já sabe que não mudaram.
- Truncar output verboso de comando (`docker build`, `docker logs`, `npm
  install` etc.) antes dele entrar no seu próprio contexto — ex.: usar
  `tail -n 30` ou `grep -i error` em vez de deixar o log inteiro ser lido
  por você e re-enviado (via cache) nos passos seguintes da mesma rodada.
- Resolver mais coisa por chamada de ferramenta em vez de ida e volta
  repetida, quando der pra prever o próximo passo sem precisar checar de
  novo.
- Se decidir que o agente de publicação também precisa do mesmo ajuste,
  registre isso como pedido seu em `MEETING.md` pra ele — não mexa direto no
  território dele.
Não precisa (e não deve) sacrificar qualidade do trabalho entregue só pra
economizar — o alvo é cortar exploração redundante, não fazer menos ou
pior. Se depois de tentar não achar espaço real de corte sem perder
qualidade, volte aqui e explique o que tentou e por que não deu.
**Resposta do Edson:** Sim, implementa. Sem prazo, faz do jeito que achar
mais limpo — só quero ver o `cache_read_tokens` cair nas próximas rodadas
em comparação com o histórico atual em `round_usage`.

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

**Atualização (2026-08-02, rodada 18:00):** tentei implementar e esbarrei
num limite técnico, não de critério — preciso de mais uma coisa antes de
conseguir terminar isso. A deploy key que uso hoje pra `git push`
(`~/.ssh/pulso_deploy_key`, host `github.com-pulso`) é só uma chave SSH
comum de repositório: dá pra ler/escrever git, mas não tem acesso nenhum à
API do GitHub. Configurar branch protection (`gh api
repos/edrobeda/pulso/branches/main/protection` ou `gh ruleset create`) e
automatizar a abertura de PR + auto-merge (`gh pr create` / `gh pr merge
--auto`) são chamadas de API do GitHub, não do git — exigem um token (PAT
ou `gh auth login`), que eu não tenho e não consigo gerar sozinho.
**O que preciso agora:** uma das duas —
(a) um personal access token de escopo fino, só pro repo `edrobeda/pulso`,
com permissão de "Administration: write" (pra branch protection/ruleset) e
"Pull requests: write" + "Contents: write" (pra eu poder criar PR e
habilitar auto-merge nas próximas rodadas) — eu guardo em `.env` como
`GH_TOKEN` (permissão 600, nunca versionado) e apago o valor bruto daqui
assim que confirmar que funciona; ou
(b) você mesmo configura a branch protection direto na UI do GitHub
(Settings → Branches → Branch protection rules, exigindo pull request
antes de mesclar, sem exigência de aprovação/status check) — nesse caso eu
ainda preciso do token pra automatizar `gh pr create`/auto-merge no meu
próprio fluxo, mas pelo menos a regra em si já valeria mesmo sem mim.
Enquanto isso não chega, continuo dando `git push` direto na `main` nesta e
nas próximas rodadas (pra não travar a entrega diária) — não é ideal, mas é
melhor que fingir que resolvi sem ter resolvido.

---

## 2026-08-01 — [RESOLVIDO] Edson pede: registrar tokens usados por rodada
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

**Concluído (rodada 2026-08-03 18:00):** tabela `round_usage` criada em
2026-08-02, gravando as rodadas do agente de infra desde então; o agente de
publicação espelhou o mesmo padrão em `publish-agent.sh` na rodada de
2026-08-03 08:00 (ver `MEETING.md`) e o insert de `agent = 'publicacao'` já
está confirmado na tabela. `/api/usage` e `/bastidores` já exibem os dois.
Fechando esta entrada.

---

*Nenhum outro pedido em aberto no momento (além do pedido de branch
protection acima, ainda esperando o token do GitHub).*
