# Checklist: erro interno vira log detalhado pro operador, resposta genérica pro cliente

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo, extraído e adaptado de um caso real para uso genérico.
> É um ponto de partida, não uma solução pronta — adapte e teste no seu
> próprio ambiente antes de confiar nele. O autor não se responsabiliza por
> qualquer dano, perda de dados ou mau funcionamento decorrente do uso
> deste conteúdo.

## O problema, em uma frase

Um `catch` de rota de API devolvia `err.message` cru pro cliente numa
resposta 500 — e não registrava nada no lado do servidor. Isso é dois
problemas independentes acontecendo na mesma linha de código, e os dois
passam despercebidos porque nada quebra visivelmente: a resposta chega
(só que revela detalhe interno) e a falha desaparece (só que ninguém vê).

- **Vazamento de detalhe interno**: `err.message` de uma falha de banco
  costuma incluir nome de tabela, coluna, trecho da query ou versão do
  driver — informação que ajuda um atacante a mapear o schema e não tem
  nenhum valor pra quem só quer saber "algo falhou".
- **Investigação impossível depois do fato**: sem log server-side, a única
  forma de descobrir o que aconteceu numa falha passada é reproduzir o bug
  de novo — se ele foi intermitente ou já não ocorre mais, o rastro já foi
  perdido pra sempre.

## Checklist

- [ ] Todo `catch` de rota loga o erro completo no servidor (`console.error(err)`
      ou equivalente estruturado) **antes** de responder ao cliente.
- [ ] A resposta ao cliente usa uma mensagem fixa e genérica (ex.:
      `{ error: 'internal error' }`), nunca `err.message` ou `err.stack` cru.
- [ ] Middleware de log por requisição (método, rota, status, duração) roda
      em toda rota, não só nas que têm tratamento de erro — assim dá pra
      reconstruir uma linha do tempo mesmo pra requisições que não lançaram
      exceção.
- [ ] O log de requisição não grava corpo de request/response inteiro por
      padrão — evita persistir dado sensível enviado pelo cliente (ex.:
      texto de um formulário) só pelo hábito de logar tudo.
- [ ] A mudança foi aplicada em **todas** as rotas de uma vez (busca/grep
      por `err.message` nas respostas), não só na rota onde o bug apareceu —
      é fácil corrigir um `catch` e esquecer os outros dez que têm o mesmo
      padrão copiado.
- [ ] Testado manualmente: forçar um erro real (ex.: derrubar a conexão com
      o banco por um instante) e confirmar que (a) o cliente recebe a
      mensagem genérica, sem detalhe interno, e (b) o log do servidor tem o
      erro completo, com stack.

## Exemplo mínimo (Express, mas o padrão vale pra qualquer framework)

```js
// Log de requisição — roda sempre, independente de erro
app.use((req, res, next) => {
  const startedAt = Date.now()
  res.on('finish', () => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} ${Date.now() - startedAt}ms`)
  })
  next()
})

app.get('/api/algo', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT ...')
    res.json(rows)
  } catch (err) {
    // Detalhe completo fica só no lado do servidor
    console.error(err)
    // Cliente recebe o mínimo necessário, nada de schema/query/stack
    res.status(500).json({ error: 'internal error' })
  }
})
```

## Por que as duas partes precisam vir juntas

Corrigir só o vazamento (generalizar a mensagem) sem adicionar o log
server-side troca um problema por outro: para de vazar detalhe, mas
também para de deixar qualquer rastro — a falha vira uma caixa preta
completa. Corrigir só o log sem generalizar a resposta resolve a
investigação mas mantém o vazamento ativo. As duas mudanças são baratas e
devem ser feitas na mesma passada por todas as rotas.
