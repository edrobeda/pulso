# Checklist: handler de erro genérico no fim da cadeia de middlewares

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo, extraído e adaptado de um caso real para uso genérico.
> É um ponto de partida, não uma solução pronta — adapte e teste no seu
> próprio ambiente antes de confiar nele. O autor não se responsabiliza por
> qualquer dano, perda de dados ou mau funcionamento decorrente do uso
> deste conteúdo.

## O problema, em uma frase

Um `catch` dentro de cada rota só pega erro que acontece dentro do corpo
daquela rota. Erro de parsing de corpo da requisição (JSON inválido, por
exemplo) acontece num middleware que roda **antes** de qualquer rota —
nenhum `catch` de rota chega a ver esse erro, e ele cai no handler de erro
padrão do framework, que em muitos casos ainda devolve stack trace completo
e caminho interno de arquivo pro cliente.

Catch por rota e handler de erro genérico no fim da cadeia resolvem
problemas diferentes, não o mesmo problema duas vezes:

- **Catch por rota**: cobre erro que acontece dentro da lógica daquela rota
  específica (query de banco falhou, chamada externa deu timeout).
- **Handler de erro genérico no fim**: é a rede de segurança pra qualquer
  erro que nenhuma rota chegou a ver — erro de parsing de corpo, erro
  síncrono lançado num middleware anterior, um `next(err)` chamado
  explicitamente de algum lugar.

## Checklist

- [ ] Existe um middleware de erro de **quatro parâmetros**
      (`err, req, res, next`) registrado **depois** de todas as rotas —
      essa aridade é o que o Express usa pra reconhecer a função como
      handler de erro, não a posição ou o nome dela.
- [ ] Erro de parsing de corpo (checar `err.type === 'entity.parse.failed'`
      ou `err instanceof SyntaxError`, dependendo do parser usado) responde
      um 4xx genérico e específico (`{ error: 'invalid json' }`), não cai no
      mesmo balde do 500.
- [ ] Qualquer outro erro que chegue até esse handler final responde 500
      genérico (nunca `err.message`/`err.stack` cru) e é logado por completo
      no servidor antes de responder — mesma disciplina do catch por rota,
      só que coberta de novo aqui pro caso de passar por cima dele.
- [ ] Testado mandando corpo malformado de propósito contra cada verbo de
      escrita (`curl -X POST ... -d '{invalido'`) e confirmando que a
      resposta é o formato de erro genérico da própria API — não a página
      padrão do framework com stack trace.
- [ ] O handler de erro genérico está depois de **todas** as rotas no
      arquivo — se vier antes de alguma rota, essa rota não é coberta por
      ele.

## Exemplo mínimo (Express, mas o princípio vale pra qualquer framework com conceito de middleware)

```js
app.use(express.json())

// ... todas as rotas aqui ...

// Handler de erro genérico — precisa ser o ÚLTIMO app.use(), com os 4
// parâmetros, mesmo que `next` nunca seja chamado dentro dele.
app.use((err, req, res, next) => {
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'invalid json' })
  }
  console.error(err) // log completo só no servidor
  res.status(500).json({ error: 'internal error' })
})
```

## Pegadinha específica do Express

O Express decide se uma função `app.use(...)` é um middleware normal ou um
handler de erro **só pela quantidade de parâmetros da função** (3 vs. 4).
Duas formas de errar isso:

- Escrever o handler de erro com só 3 parâmetros por engano — o Express o
  trata como middleware normal, ele nunca é chamado quando um erro
  acontece, e o comportamento observado é "parece que não fiz nada".
- Registrar o handler de erro **antes** de alguma rota — rotas registradas
  depois dele não são cobertas, porque a ordem de registro é a ordem real
  de execução da cadeia.

Teste sempre com um erro de verdade (corpo malformado é o mais fácil de
forçar de propósito), nunca assuma que "a função tem 4 parâmetros" já
prova que ela está sendo chamada.
