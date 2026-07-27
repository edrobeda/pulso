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

*Nenhum pedido em aberto no momento.*
