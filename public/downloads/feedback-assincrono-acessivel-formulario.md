# Feedback assíncrono de formulário acessível (sucesso e erro)

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Um formulário que envia algo de forma assíncrona (comentário, resposta,
inscrição) costuma sinalizar o resultado só visualmente: o botão volta do
texto "enviando…" pro texto normal, a lista se atualiza com o item novo, ou
uma frase de erro aparece abaixo do campo. Pra quem enxerga a tela, isso já
"parece" feedback suficiente. Pra quem usa leitor de tela, nada daquilo é
necessariamente anunciado — o foco continua onde estava (geralmente ainda no
botão ou no campo), e um `<p>` de erro ou sucesso que simplesmente aparece no
DOM, sem nenhum atributo ARIA, não dispara leitura automática nenhuma. O
visitante que ouviu "enviando…" não ouve mais nada depois — não sabe se deu
certo, se deu erro, ou se o site travou.

Tem uma armadilha a mais quando o formulário se fecha ao ter sucesso (ex.:
um formulário de resposta que volta a ficar escondido assim que a resposta é
publicada): se a confirmação de sucesso for guardada só no estado do próprio
formulário, ela desaparece do DOM no mesmo instante em que aparece — o
formulário fecha, o estado que guardava a mensagem não existe mais onde
estava, e a confirmação nunca chega a ficar visível tempo suficiente pra
ninguém, nem visual nem por leitor de tela.

## A lição

Duas peças, independentes uma da outra:

1. **Marcação ARIA certa pra cada tipo de mensagem.** Erro que exige atenção
   imediata usa `role="alert"` (equivalente a `aria-live="assertive"` —
   interrompe o que o leitor de tela está fazendo pra anunciar na hora).
   Confirmação de sucesso, que não é urgente, usa `role="status"` com
   `aria-live="polite"` (anuncia assim que o leitor de tela estiver livre,
   sem interromper). Não use `role="alert"` pra sucesso — equivale a gritar
   uma notícia boa, mal uso do nível de urgência.

2. **A mensagem de sucesso precisa sobreviver ao fechamento do formulário
   que a gerou.** Se o formulário se esconde/reseta ao publicar com sucesso,
   não guarde a confirmação como estado local dele — amarre a um identificador
   que sobrevive além do formulário (o item pai da lista, um id, um estado no
   componente que renderiza a lista inteira). Teste fechando os olhos e
   usando só um leitor de tela de verdade (VoiceOver, NVDA, ou o leitor
   embutido do navegador) pra confirmar que a frase realmente é lida — ver o
   texto aparecer na tela não prova que foi anunciado.

## Exemplo — certo vs. errado

```jsx
// Errado: nada é anunciado, mensagem sem papel ARIA
{error && <p className="form-error">{error}</p>}
{success && <p className="form-success">{success}</p>}

// Certo: erro interrompe (alert), sucesso anuncia sem interromper (status)
{error && (
  <p className="form-error" role="alert">
    {error}
  </p>
)}
{!error && success && (
  <p className="form-success" role="status" aria-live="polite">
    {success}
  </p>
)}
```

```jsx
// Errado: sucesso guardado no estado do próprio form, que fecha ao publicar
const [replyOpen, setReplyOpen] = useState(false)
const [replySuccess, setReplySuccess] = useState(false)
// ao publicar: setReplyOpen(false) — replySuccess nunca chega a ser visto,
// porque o bloco que o renderiza (dentro do form) já não existe mais.

// Certo: sucesso amarrado ao item pai, que continua montado
const [replyOpenFor, setReplyOpenFor] = useState(null)       // qual item tem form aberto
const [replySuccessFor, setReplySuccessFor] = useState(null) // qual item recebeu confirmação
// ao publicar: setReplyOpenFor(null); setReplySuccessFor(parentId)
// a confirmação é renderizada no item pai (sempre montado), não dentro do form
```

## Checklist

- [ ] Toda mensagem de erro de formulário tem `role="alert"`.
- [ ] Toda mensagem de sucesso tem `role="status"` + `aria-live="polite"`
      (nunca `role="alert"` pra boa notícia).
- [ ] Se o formulário se fecha/reseta ao ter sucesso, a mensagem de
      confirmação vive em um estado que **não** é limpo junto — amarrada a um
      elemento que continua montado (item da lista, componente pai).
- [ ] Testado de verdade com um leitor de tela (não só inspecionando o HTML
      gerado) — confirma que a frase é realmente lida, não só presente no DOM.
- [ ] Mensagem de erro e de sucesso nunca aparecem juntas ao mesmo tempo pro
      mesmo formulário (limpe uma ao disparar a outra).
