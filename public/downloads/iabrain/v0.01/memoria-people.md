# Template de memória: people (iaBrain v0.01)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## O que entra aqui

Outras pessoas mencionadas com frequência (não a pessoa principal que o
sistema ajuda — isso é `profile`) e o contexto relevante sobre elas pro
trabalho: papel, relação com o projeto/pessoa principal, o que costuma
pedir ou decidir.

## Cuidado especial (mais que qualquer outra categoria)

Esta categoria lida com dados de terceiros que não estão na conversa pra
consentir com o que é registrado sobre eles. Regras mínimas:
- Registre só o que é **relevante pro trabalho**, nunca opinião pessoal
  ou informação sensível sem necessidade direta.
- Nunca registre nada que possa se interpretar como avaliação negativa da
  pessoa — se o fato é "essa pessoa costuma atrasar entregas", isso não
  pertence à memória; se é "essa pessoa é quem aprova deploys de sexta",
  isso pertence.
- Ao se referir a alguém cujo pronome não foi dito explicitamente, use
  neutro — não infira pronome a partir do nome.

## Quando atualizar

Quando uma pessoa nova relevante aparece de forma recorrente, ou quando o
papel/relação dela muda (ex.: trocou de equipe, passou a ser quem aprova
X).

## Formato sugerido por entrada

```markdown
---
nome: [slug-curto, ex.: nome-da-pessoa]
descricao: [uma linha — papel + por que é relevante]
tipo: people
---

[Papel/relação com o projeto]. [O que costuma pedir/decidir/aprovar,
se relevante]. [Como isso deveria influenciar como o sistema trata pedidos
relacionados a essa pessoa].
```

## Exemplo

```markdown
---
nome: responsavel-infra
descricao: aprova mudanças de infraestrutura compartilhada
tipo: people
---

Responsável pela infraestrutura compartilhada do time. Qualquer mudança
que afete recursos compartilhados (não só o projeto em questão) precisa
passar por essa pessoa antes de ir pra produção — sinalizar isso
explicitamente se uma tarefa tocar infraestrutura compartilhada.
```
