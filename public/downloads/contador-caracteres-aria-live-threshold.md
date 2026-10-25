# Contador de caracteres acessível (aviso por limiar, não por tecla)

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Um `<textarea maxLength={N}>` trunca silenciosamente: ao atingir o limite,
o navegador simplesmente para de aceitar tecla nova, sem erro, sem evento,
sem nada. Pra compensar isso, é comum adicionar um contador visual
("120/1000") que avisa quem vê a tela antes de chegar lá.

O erro recorrente: implementar esse contador como puramente decorativo,
com `aria-hidden="true"`, pra evitar que um leitor de tela narre "999
restantes, 998 restantes…" a cada tecla digitada (o que seria, de fato,
insuportável). Isso resolve o barulho, mas joga fora o aviso inteiro —
quem usa leitor de tela fica exatamente onde estava antes do contador
existir: sem nenhum sinal de que o texto está perto do limite, e sem
explicação de por que, em algum momento, o texto simplesmente para de
crescer.

É uma falsa dicotomia: a escolha não é "anuncia tudo" vs. "não anuncia
nada". Dá pra anunciar por limiar — poucos pontos marcantes ao longo da
digitação — sem narrar cada tecla.

## A lição

- Mantenha o contador visual (`aria-hidden="true"` nele é correto —
  ninguém precisa ouvir a contagem inteira).
- Adicione uma region `aria-live="polite"` **separada**, que só muda de
  conteúdo quando o restante cruza um limiar predefinido (ex.: 20
  caracteres restantes, depois 0) — não a cada tecla.
- Debounce/threshold é o mecanismo, não uma biblioteca especial: compare o
  valor anterior com o atual e só atualize o texto da live region quando
  cruzar de um lado do limiar pro outro.
- Teste com um leitor de tela de verdade (não só visualmente): digite até
  o limite e confirme que ele anuncia pelo menos uma vez antes do texto
  parar de crescer, e não narra a cada tecla antes disso.

## Exemplo (React)

```jsx
function useThresholdAnnouncement(remaining, thresholds = [20, 0]) {
  const lastAnnounced = useRef(null)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const crossed = thresholds.find((t) => remaining <= t)
    if (crossed !== undefined && crossed !== lastAnnounced.current) {
      lastAnnounced.current = crossed
      setAnnouncement(
        crossed === 0
          ? 'limite de caracteres atingido'
          : `${remaining} caracteres restantes`
      )
    } else if (crossed === undefined) {
      lastAnnounced.current = null
    }
  }, [remaining, thresholds])

  return announcement
}

function CommentForm() {
  const [body, setBody] = useState('')
  const max = 1000
  const remaining = max - body.length
  const announcement = useThresholdAnnouncement(remaining)

  return (
    <>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={max}
        aria-label="Seu comentário"
      />

      {/* visual, atualiza a cada tecla, não narrado */}
      <p aria-hidden="true" className="counter">
        {body.length}/{max}
      </p>

      {/* só narra quando cruza um limiar, nunca a cada tecla */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  )
}
```

## Checklist antes de considerar "feito"

- [ ] O contador visual existe e atualiza a cada tecla (`aria-hidden="true"`
      nele é esperado, não um bug).
- [ ] Existe uma region `aria-live="polite"` separada (pode ser visualmente
      oculta via `sr-only`, não `aria-hidden`) que só muda de texto ao
      cruzar um limiar.
- [ ] O limiar escolhido dá tempo real de reação (ex.: avisar faltando 20
      caracteres, não só no exato 0).
- [ ] Testado com leitor de tela real digitando até o limite — confirma
      pelo menos um anúncio antes do texto parar de crescer.
- [ ] Nenhuma tecla antes do primeiro limiar dispara qualquer narração.
