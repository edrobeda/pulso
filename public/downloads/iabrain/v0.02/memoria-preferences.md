# Template de memória: preferences (iaBrain v0.01)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## O que entra aqui

Orientação sobre **como** trabalhar — tanto o que evitar quanto o que
repetir. As duas direções importam: se você só registra correções, o
sistema fica cada vez mais cauteloso e se afasta de abordagens que já
foram validadas; sem confirmação registrada, ele hesita de novo numa
escolha que já foi aprovada antes.

## Quando atualizar

- **Correção**: a pessoa reage negativamente a uma abordagem ("não faz
  assim", "para de fazer X") — fácil de perceber.
- **Confirmação**: a pessoa aceita sem ressalva uma escolha não-óbvia, ou
  diz explicitamente "isso, continua assim" — mais fácil de deixar passar
  despercebido do que uma correção, vale prestar atenção ativa.

## Formato sugerido por entrada

```markdown
---
nome: [slug-curto]
descricao: [uma linha]
tipo: preferences
---

[A regra em si] — **Por quê**: [a razão dada, geralmente um incidente
passado ou uma preferência forte — sem o porquê, fica impossível julgar
casos de borda depois]. **Quando aplicar**: [em que situação essa regra
entra em ação — nem toda preferência é universal].
```

## Exemplo (correção)

```markdown
---
nome: sem-mock-em-teste-de-integracao
descricao: testes de integração devem usar banco real, não mock
tipo: preferences
---

Não usar mock de banco de dados em testes de integração. **Por quê**: um
incidente passado em que testes mockados passaram mas a migração real
quebrou em produção, porque o mock divergia do comportamento real do
banco. **Quando aplicar**: qualquer teste rotulado "integração" — testes
unitários continuam podendo mockar normalmente.
```

## Exemplo (confirmação)

```markdown
---
nome: pr-unico-para-refatoracao-desta-area
descricao: preferir um PR grande a vários pequenos nesta área específica
tipo: preferences
---

Pra refatorações nesta área do código, um PR único é preferível a vários
pequenos. **Por quê**: a pessoa confirmou explicitamente essa escolha
depois de eu ter optado por um PR único em vez do padrão usual de PRs
pequenos — "splitting isso teria sido só ruído". **Quando aplicar**: só
refatorações dentro desta área específica, não é uma regra geral do
projeto.
```
