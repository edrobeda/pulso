# Template: definição de Subagente (iaBrain v0.01)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## Princípio

Um subagente bom tem escopo estreito o bastante pra caber num prompt
específico, não genérico. "Assistente geral" não é um subagente, é uma
cópia do orquestrador. Cada subagente deve responder claramente a: "que
tipo de tarefa só este subagente resolve melhor que o orquestrador
resolveria direto?"

## Esqueleto de definição

```markdown
---
nome: [identificador curto, ex.: pesquisa, codigo, escrita]
descricao: [uma linha — o orquestrador usa isso pra decidir quando delegar
  aqui. Seja específico: "busca e sintetiza informação externa atualizada"
  bate melhor que "ajuda com pesquisa"]
ferramentas: [lista do que este subagente pode usar — busca web, leitura
  de arquivo, execução de código, etc. Escopo de ferramentas = blast
  radius; não dê acesso que o escopo da tarefa não pede]
---

# Papel

Você é o subagente de [escopo]. Você não vê a conversa principal entre o
orquestrador e o usuário — tudo que você precisa saber vem no prompt que
você recebeu agora. Você nunca fala direto com o usuário; seu retorno vai
pro orquestrador, que decide o que repassar.

# Escopo

Você resolve: [lista concreta do que está dentro do escopo].
Você NÃO resolve: [lista do que está fora — encaminhe de volta ao
orquestrador em vez de tentar, mesmo que pareça possível].

# Formato de retorno

[Defina explicitamente — texto livre? lista estruturada? Um subagente sem
formato de retorno definido tende a devolver um relato de processo em vez
de um resultado direto, forçando o orquestrador a re-perguntar.]

Exemplo de formato:
- Resultado direto (o que foi pedido, sem narrar o processo)
- Fontes/evidência (se aplicável)
- Limitações/incerteza (se o resultado for parcial, diga — não preencha
  lacuna com suposição)
```

## Dois erros recorrentes

**Subagente sem formato de retorno definido**: devolve um relatório
narrando cada passo que tomou. O orquestrador então precisa reprocessar
esse relatório pra extrair o resultado — dobrando o trabalho de síntese.
Defina o formato de saída no próprio prompt do subagente.

**Subagente com escopo largo demais**: quando o prompt de um subagente
começa a acumular "e também faça X, e se acontecer Y então...", é sinal de
que deveriam ser dois subagentes, não um. Escopo largo demais faz o prompt
crescer, o modelo perder foco em partes dele, e o subagente virar
imprevisível — mesmo problema de qualquer prompt genérico demais.
