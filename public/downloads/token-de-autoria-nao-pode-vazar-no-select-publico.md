# Checklist: coluna-capacidade numa tabela com leitura pública

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo, extraído e adaptado de um caso real para uso genérico.
> É um ponto de partida, não uma solução pronta — adapte e teste no seu
> próprio ambiente antes de confiar nele. O autor não se responsabiliza por
> qualquer dano, perda de dados ou mau funcionamento decorrente do uso
> deste conteúdo.

## O problema, em uma frase

Uma tabela que já tinha um endpoint de leitura pública (listar conteúdo
anônimo pra qualquer visitante) ganhou uma coluna nova: um token opaco,
gerado no navegador de quem criou aquele conteúdo, guardado como prova de
autoria pra liberar uma ação futura reservada só a quem criou (editar,
excluir, qualquer coisa do tipo "só o autor pode"). O `INSERT` grava o
token certo; o `SELECT` público de hoje usa lista explícita de colunas e
não devolve ele — mas essa garantia não é uma propriedade da tabela, é uma
disciplina que precisa se repetir em todo `SELECT` futuro contra ela.

## Por que isso é um risco estrutural, não um bug pontual

- **Um token de prova de autoria, uma vez lido por qualquer pessoa, vira
  capacidade de qualquer pessoa.** Diferente de um dado sensível que só
  "constrange" se vazar (um IP, um e-mail), esse token é uma credencial de
  ação: quem lê o valor pode literalmente executar a ação reservada ao
  autor original — nesse caso concreto, apagar o comentário de outra
  pessoa — sem nunca ter criado o conteúdo.
- **`SELECT *` é uma aposta que só fica mais arriscada com o tempo.**
  Numa tabela sem nenhuma coluna sensível, `SELECT *` é inofensivo. No dia
  em que uma coluna-capacidade é adicionada, todo `SELECT *` pré-existente
  contra aquela tabela se torna um vazamento em potencial — sem que nada
  no código dele tenha mudado.
- **O lado da escrita costuma ser testado; o lado da leitura, não.** É
  fácil confirmar que o `INSERT` gravou o valor certo (query de debug,
  log) e esquecer de confirmar separadamente que nenhum endpoint de
  leitura — nem os que já existiam antes da coluna nova — devolve ela.

## O padrão que resolve

1. **Nunca use `SELECT *` numa tabela que tem (ou pode vir a ter) uma
   coluna-capacidade.** Lista explícita de colunas em todo `SELECT`,
   sempre — inclusive nos que já existiam antes da coluna nova nascer.
2. **Ao adicionar uma coluna-capacidade, audite todo `SELECT` existente
   contra aquela tabela**, não só o `INSERT`/`UPDATE` que você está
   escrevendo agora. Um grep pelo nome da tabela encontra os candidatos.
3. **Teste pelo comportamento observável, não pelo código.** Depois de
   implementar, chame o endpoint público de verdade (`curl`) e confirme
   que a coluna nova não aparece na resposta — não confie em "o SELECT
   lista as colunas certas, deve estar ok" sem checar a resposta real.
4. **Documente a limitação de captura no momento da criação.** Um token
   de prova de autoria só existe pra registros criados depois da coluna
   existir — qualquer ação de autoatendimento baseada nele nunca vai
   alcançar conteúdo mais antigo. Isso não é bug, é escopo conhecido.

## Exemplo mínimo (Node/Express + Postgres, mas o padrão vale pra qualquer stack)

```js
// INSERT: captura o token no momento da criação — é a única janela em
// que isso é possível.
await pool.query(
  `INSERT INTO post_comments (slug, author_name, body, author_token)
   VALUES ($1, $2, $3, $4)`,
  [slug, authorName, body, authorToken]
)

// SELECT público: lista explícita de colunas, nunca SELECT *.
// author_token FICA DE FORA de propósito — se alguém adicionar uma
// coluna nova aqui, essa linha é o lugar que precisa de revisão.
const { rows } = await pool.query(
  `SELECT id, author_name, body, created_at FROM post_comments
   WHERE slug = $1 AND visible = true`,
  [slug]
)

// Ação de autoatendimento: token comparado no WHERE, nunca devolvido
// numa resposta. Soft-hide em vez de DELETE evita lidar com cascade.
await pool.query(
  `UPDATE post_comments SET visible = false
   WHERE id = $1 AND author_token = $2
     AND created_at > now() - interval '15 minutes'`,
  [commentId, clientToken]
)
```

## Checklist rápido pra aplicar ao adicionar uma coluna-capacidade

- [ ] Todo `SELECT` contra a tabela (não só o que você está escrevendo
      agora) foi revisado — grep pelo nome da tabela, não confiar na
      memória de "só tem um lugar que lê isso".
- [ ] Nenhum `SELECT *` sobrevive contra essa tabela, em nenhum endpoint,
      nem nos que pareciam inofensivos antes da coluna nova existir.
- [ ] Testado pela resposta real do endpoint público (`curl`), não só
      pela leitura do código do `SELECT`.
- [ ] A ação de autoatendimento (editar/excluir/o que for) está escopada
      por tempo e/ou por estado (janela curta, uma vez só, etc.) — um
      token fraco (sem conta, sem assinatura criptográfica) merece um
      raio de ação pequeno, não permissão permanente e irrestrita.
- [ ] A limitação "não alcança conteúdo criado antes da coluna existir"
      está documentada em algum lugar (comentário no código, nota de
      changelog) — não é um defeito a ser corrigido depois.
