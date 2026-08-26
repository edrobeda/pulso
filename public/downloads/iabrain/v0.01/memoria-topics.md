# Template de memória: topics (iaBrain v0.01)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## O que entra aqui

Assuntos/projetos recorrentes: estado atual, decisões tomadas e o motivo
por trás delas, prazos relevantes. Ao contrário de `profile`, isso muda
com frequência — trate como algo que precisa ser **revisado**, não só
acumulado.

## O que NÃO entra aqui

- Estado que muda a cada poucas horas (isso não é memória de longo prazo,
  é contexto de sessão)
- Algo derivável olhando o estado atual do sistema/código diretamente —
  se dá pra checar na hora, não precisa estar em memória

## Quando atualizar

Quando você aprende quem está fazendo o quê, por quê, ou até quando —
e principalmente quando uma decisão é tomada (guarde o motivo, não só a
decisão: o motivo é o que permite julgar exceções depois).

## Cuidado principal: memória decai

Datas relativas ("quinta-feira", "semana que vem") viram ambíguas depois
que a conversa termina — converta pra data absoluta antes de gravar.
Releia entradas antigas periodicamente: um `topic` desatualizado é pior
que nenhum, porque parece autoritativo sem ser.

## Formato sugerido por entrada

```markdown
---
nome: [slug-curto]
descricao: [uma linha]
tipo: topics
---

[O fato/decisão] — **Por quê**: [motivação, restrição ou pedido por trás
disso]. **Como aplicar**: [como isso deveria influenciar decisões
futuras].
```

## Exemplo

```markdown
---
nome: congelamento-de-merge-release-mobile
descricao: janela de congelamento de merges por causa do corte de release
tipo: topics
---

Congelamento de merges não-críticos a partir de 2026-09-10 — time mobile
vai cortar uma branch de release. **Por quê**: qualquer merge depois desse
corte só entra na release seguinte, não na atual. **Como aplicar**: sinalizar
qualquer trabalho não-crítico agendado pra depois dessa data; trabalho
crítico (correção de bug bloqueante) segue normalmente.
```
