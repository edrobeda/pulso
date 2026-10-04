# Painel/disclosure dispensável: Esc fecha, e o foco volta pra quem abriu

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Um botão que abre um painel (um popover, um form inline, um menu) costuma
nascer com um único jeito de fechar: clicar de novo no mesmo botão. Funciona
bem no mouse, mas quem navega por teclado não tem outra saída além de tabular
até achar esse botão de novo — não existe um padrão convencional de "aperte
Esc" se ninguém implementou isso.

O problema maior aparece quando esse fechamento por teclado é adicionado
depois, como correção pontual, e o mesmo padrão (abrir estado, escutar
`keydown` de Escape, fechar) é copiado à mão em cada componente que precisa
dele. Cada cópia é uma chance de esquecer uma parte: uma lembra de devolver o
foco pro botão que abriu o painel, a próxima não lembra — e aí o foco, depois
de fechar, fica solto em qualquer lugar (às vezes em cima de um elemento que
acabou de ser ocultado/removido do DOM), o que é tão ruim pra navegação por
teclado quanto não ter Esc nenhum. Nada disso aparece em teste manual de
mouse, nem gera erro — só se percebe testando com teclado de verdade.

## O hook (`useDismissablePanel.js`)

```js
import { useEffect, useRef } from 'react'

// `isOpen`: estado booleano que controla o painel.
// `onClose`: função que fecha o painel (ex. setOpen(false)).
// Devolve `triggerRef` — amarre ao botão que abre o painel.
export function useDismissablePanel(isOpen, onClose) {
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    function handleKeydown(e) {
      if (e.key === 'Escape') {
        onClose()
        triggerRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [isOpen, onClose])

  return triggerRef
}
```

Uso:

```jsx
function BugReportWidget() {
  const [open, setOpen] = useState(false)
  const triggerRef = useDismissablePanel(open, () => setOpen(false))

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        reportar problema
      </button>
      {open && <div role="dialog">{/* ... */}</div>}
    </>
  )
}
```

Um painel sem botão de disparo fixo (ex. um form de resposta que abre a
partir de um item de lista, não de um único botão sempre presente) ainda se
beneficia do fechamento por Esc — só não tem um `triggerRef` fixo pra devolver
foco; nesse caso, devolva o foco pro próprio item da lista que originou a
abertura.

## Checklist

- [ ] Todo painel/disclosure custom (não um `<dialog>` nativo, que já resolve
      isso sozinho) fecha com Esc, não só clicando de novo no botão que abriu.
- [ ] Fechar devolve o foco pra algo visível e ainda presente no DOM — nunca
      deixa o foco "solto" (no `body`) nem em cima de um elemento que acabou
      de sumir.
- [ ] A lógica de abrir/fechar/Esc/foco vive num hook único reutilizável, não
      copiada e colada em cada componente — duplicação é exatamente como uma
      cópia acaba mais completa que a outra.
- [ ] Testado de verdade com teclado (Tab até o botão, Enter pra abrir, Esc
      pra fechar, confirma visualmente onde o foco ficou) — não só com mouse.
- [ ] Se existir mais de um painel do tipo na mesma página, Esc fecha só o
      que está aberto no momento, não todos de uma vez.
