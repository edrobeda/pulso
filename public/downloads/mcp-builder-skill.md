---
name: mcp-builder
description: Guia um agente a construir um servidor MCP funcional, de ponta a ponta, pra um serviço específico — verificando cada etapa antes de seguir pra próxima, até o MCP estar realmente no ar (tools testadas com chamada real) ou até ficar provado que não é possível com o acesso disponível. Use quando o pedido for "cria um MCP pra [serviço]", "faz um servidor MCP que conecte no [serviço]" ou equivalente.
---

# MCP Builder (skill guiada)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Esta skill instrui um agente a escrever código, rodar comandos e
> lidar com credenciais de forma autônoma — revise o que foi gerado antes
> de usar em produção, principalmente a camada de autenticação. O autor
> não se responsabiliza por qualquer dano, vazamento de credencial, custo
> de API ou mau funcionamento decorrente do uso deste conteúdo.

## Diferença desta skill pro guia de referência

Existe um documento separado, `mcp-builder.md` (baixado junto/ao lado
deste), com o material técnico de apoio: arquitetura, código de fallback
de auth (loopback vs túnel Cloudflare), checklists de segurança e de
qualidade de tool. **Esta skill não repete esse conteúdo** — ela é o
processo que consulta esse material nas etapas certas e não avança sem
verificar o resultado de cada etapa. Se você só quer ler e entender o
padrão, vá direto no `mcp-builder.md`. Se você quer que um agente
*construa* o MCP de verdade, use esta skill.

## Como instalar

- **Claude Code**: salve este arquivo como
  `.claude/skills/mcp-builder/SKILL.md` no seu projeto (ou na pasta de
  skills do usuário, pra valer em todo projeto). Descoberta é automática
  pela `description` do frontmatter.
- **OpenCode**: adapte pro formato de skill/agente customizado suportado
  pela versão instalada — confira a documentação atual, o esquema muda
  entre versões.
- **Genérico**: cole o conteúdo abaixo (a partir de "## Processo") como
  parte do system prompt do agente responsável, ou injete sob demanda
  quando o pedido do usuário bater com a `description` acima.

## Processo — siga em ordem, não pule etapa de verificação

### Etapa 0 — Levantamento (antes de escrever qualquer código)

Pergunte ao usuário (ou confirme a partir do pedido, se já estiver claro):
- Qual serviço/API o MCP vai conectar?
- Quais operações concretas ele precisa expor como tools (ex.: "listar
  posts", "criar issue")? Liste-as nominalmente — "acesso geral à API" não
  é escopo suficiente pra desenhar tools.
- O serviço já tem documentação de API pública? Busque e leia antes de
  seguir — não assuma formato de endpoint/auth sem confirmar.

**Ponto de parada**: se não existe documentação de API acessível nem
forma conhecida de autenticar (nem chave, nem OAuth documentado), pare
aqui e reporte "não é possível com o que está disponível" — não tente
adivinhar um contrato de API que não existe.

### Etapa 1 — Descobrir o modelo de autenticação do provedor

Determine, olhando a documentação real do provedor (não suponha):
- É API key simples (sem OAuth)? Vá direto pra Etapa 3.
- É OAuth? O provedor aceita `redirect_uri=http://localhost:<porta>`?
  Procure isso explicitamente na doc de OAuth dele.

Se aceita `localhost`: caminho A (loopback simples).
Se exige HTTPS público: caminho B (túnel). Ver `mcp-builder.md` seção 4
pro código de referência dos dois caminhos, e seção 5 pro túnel
Cloudflare.

**Ponto de parada**: se o provedor exige aprovação manual de app/allowlist
de redirect URI por um humano do lado do provedor (não só cadastro
self-service) e o usuário não tem esse acesso, pare e registre isso como
bloqueio — não é algo que dá pra contornar com túnel.

### Etapa 2 — Escolher transporte

`stdio` por padrão (uso local, a maioria dos casos). Só vá pra HTTP/SSE
remoto se o pedido explicitamente exigir disponibilidade 24/7 (webhook,
cron) — nesse caso isso é uma decisão de infraestrutura adicional, avise
o usuário do escopo extra antes de seguir.

### Etapa 3 — Scaffold do projeto

Estrutura de referência em `mcp-builder.md` seção 3. Crie o projeto,
instale dependências.

**Verificação obrigatória antes de seguir**: `npm install` termina sem
erro E `npx tsc --noEmit` (ou equivalente) sem erro. Se falhar, corrija
antes de ir pra Etapa 4 — não empilhe camada nova em cima de scaffold
quebrado.

### Etapa 4 — Implementar autenticação

Implemente o caminho decidido na Etapa 1, usando o código de referência
de `mcp-builder.md` seção 4 (e 5, se for túnel) como base — adapte pro
provedor real, não copie literalmente sem revisar contra a doc do
provedor.

**Verificação obrigatória antes de seguir**: rode o fluxo de auth de
verdade (não simule). Confirme:
1. Token foi obtido e persistido.
2. Uma chamada de teste real à API do provedor com esse token retorna
   sucesso (não só "o fluxo terminou sem erro" — confirme resposta HTTP
   válida do provedor).

**Ponto de parada**: se depois de tentar corrigir o fluxo (config errada,
redirect URI não cadastrado, etc.) a autenticação continuar falhando por
um motivo que não está sob seu controle (ex.: app do provedor precisa de
aprovação manual, credencial que o usuário não forneceu), pare, registre
exatamente o erro e o motivo, e reporte bloqueio — não fique tentando
indefinidamente variações do mesmo fluxo que já falhou por causa externa.

### Etapa 5 — Implementar as tools

Uma tool por vez, na ordem de prioridade que o usuário deu na Etapa 0.
Para cada tool: implemente, então teste com uma chamada real (não mock)
antes de passar pra próxima. Ver `mcp-builder.md` seção 7 pro checklist
de qualidade de tool (nome, descrição, schema Zod, mensagens de erro
acionáveis, anotações).

**Verificação por tool**: a chamada real devolve o dado esperado do
serviço de verdade. Se uma tool específica falhar e as outras
funcionarem, não bloqueie o MCP inteiro — entregue as que funcionam e
registre a que não funcionou como limitação conhecida.

### Etapa 6 — Teste ponta a ponta com um cliente MCP real

Conecte o servidor a um cliente MCP de verdade (Claude Code, MCP
Inspector, ou o que estiver disponível no ambiente) e confirme:
- As tools aparecem listadas corretamente.
- Pelo menos uma chamada real por tool funciona a partir do cliente (não
  só testado isolado no passo anterior).

### Etapa 7 — Relatório final

Reporte um dos dois resultados, nunca um meio-termo vago:
- **No ar**: liste as tools funcionando, o caminho de auth usado
  (loopback ou túnel), e confirme que passou pelo checklist de segurança
  de `mcp-builder.md` seção 6 antes de considerar pronto pra uso real.
- **Não foi possível**: diga exatamente em qual etapa travou e por quê
  (motivo específico, não "deu erro") — isso é informação útil mesmo sem
  entrega, e evita que alguém tente o mesmo caminho já testado.

## Quando parar de vez (não é "ainda não tentei o suficiente")

- Provedor não documenta nenhuma forma pública de autenticação.
- Provedor exige aprovação manual de terceiro que o usuário não tem como
  obter na hora.
- Credencial necessária (chave, secret de app) não foi fornecida e não é
  algo que dá pra gerar sozinho.
- Depois de identificado um bloqueio real (não um bug seu), tentar de
  novo a mesma coisa sem mudar nada não vira progresso — pare e reporte.
