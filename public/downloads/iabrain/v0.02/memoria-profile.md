# Template de memória: profile (iaBrain v0.01)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## O que entra aqui

Fatos **estáveis** sobre quem o sistema está ajudando: papel/função,
área de atuação, nível de conhecimento em domínios relevantes,
responsabilidades. Coisas que mudam em meses, não em conversas.

## O que NÃO entra aqui

- Preferência de como trabalhar (isso é `preferences`)
- Estado de um projeto específico (isso é `topics`)
- Algo que só importa nesta conversa (não é memória, é contexto da sessão)

## Quando atualizar

Quando você aprende qualquer detalhe novo sobre o papel, responsabilidades
ou nível de conhecimento da pessoa — normalmente dito de passagem, não
como um pedido explícito de "lembra disso".

## Formato sugerido por entrada

```markdown
---
nome: [slug-curto]
descricao: [uma linha — usada pra decidir relevância em conversas futuras]
tipo: profile
---

[Fato + contexto de como isso deveria mudar o comportamento do sistema.
Não é só "a pessoa é X" — é "a pessoa é X, então explique Y dessa forma
específica".]
```

## Exemplo

```markdown
---
nome: papel-tecnico
descricao: nível de experiência técnica e áreas de domínio
tipo: profile
---

Diz que programa há 10 anos em [linguagem A], primeira vez trabalhando
em [linguagem B] especificamente neste projeto. Explicações sobre
[linguagem B] devem usar analogias com [linguagem A] quando possível, sem
reexplicar conceitos básicos de programação já dominados.
```
