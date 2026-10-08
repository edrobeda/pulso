# Template: Skill de referência (iaBrain v0.01)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## O que é um skill (nesse padrão)

Um skill não é um agente nem executa nada sozinho — é um documento de
referência que um agente (orquestrador ou subagente) consulta antes de
agir numa tarefa específica. A diferença entre um skill útil e um inútil:
um skill útil muda o resultado. Se o documento só repete conselho genérico
que o modelo já "sabe" (seja claro, seja cuidadoso), ele não vale o espaço
de contexto que ocupa.

## Quando escrever um skill

- Uma tarefa tem um formato/convenção específico que não é óbvio a partir
  do pedido em si (ex.: como formatar uma resposta pro seu domínio, um
  checklist de validação, um padrão de nomenclatura).
- Um erro se repete entre execuções diferentes da mesma tarefa — em vez de
  corrigir toda vez, documente a regra uma vez no skill.
- Existe conhecimento específico do seu contexto (do seu produto, do seu
  domínio) que o modelo genuinamente não tem por padrão.

## Esqueleto

```markdown
---
nome: [identificador curto, kebab-case]
descricao: [uma linha específica — usada pra decidir quando este skill se
  aplica. "gera relatório de vendas no formato X" bate melhor que "ajuda
  com relatórios"]
---

# Quando usar este skill

[Gatilhos concretos — que tipo de pedido deveria disparar a leitura deste
skill antes de agir.]

# Passo a passo / checklist

[A parte que realmente muda o resultado — passos concretos, formato
esperado, exemplos de certo/errado, armadilhas conhecidas.]

# Exemplo

[Um exemplo completo, do pedido até o resultado esperado, vale mais que
um parágrafo de instrução abstrata.]
```

## Erro comum: skill genérico demais

```markdown
<!-- fraco — não muda comportamento -->
# Como escrever bem
Seja claro, conciso e correto. Revise antes de entregar.
```

```markdown
<!-- forte — específico o bastante pra ser acionável -->
# Como formatar um relatório de incidente
1. Título: `[SEVERIDADE] resumo em <10 palavras`
2. Primeira linha: impacto observável (não causa raiz — isso vem depois)
3. Seção "Linha do tempo": timestamps em UTC, um evento por linha
4. Seção "Causa raiz": só depois de confirmada, nunca especulação
5. Nunca inclua credencial ou dado de cliente identificável no corpo
```

O segundo exemplo é acionável porque um agente que o lê sabe exatamente o
que fazer diferente. O primeiro não muda nada porque já é o comportamento
padrão esperado de qualquer resposta.
