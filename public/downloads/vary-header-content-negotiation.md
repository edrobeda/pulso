# Nota: conteúdo negociado por header precisa de `Vary` (ou vira cache envenenado)

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano, perda de dados ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

É comum uma mesma URL devolver representações diferentes dependendo de um
header da requisição:

- HTML pré-renderizado enxuto para bots de preview de link / crawlers,
  e o shell da SPA (só JS) para navegadores — decidido por `User-Agent`.
- resposta em idioma diferente por `Accept-Language`.
- JSON ou HTML na mesma rota por `Accept`.
- corpo comprimido ou não por `Accept-Encoding`.
- variação por `Cookie` de sessão / feature flag.

Se a resposta **não** declara de qual header ela depende, qualquer cache
compartilhado no caminho (CDN, proxy reverso, cache do navegador, cache de
"edge" do framework) guarda a primeira variante que viu e serve ela para
todo mundo naquela URL — até o TTL expirar.

Resultado típico: um humano abre o post e recebe o HTML enxuto que era pra
ir só pro robô de preview (ou o contrário: o robô recebe o shell de JS e o
preview do link fica vazio). Nada dá erro. É intermitente, depende de quem
"esquentou" o cache primeiro, e some ao recarregar sem cache — o que torna
difícil de reproduzir e fácil de fechar como "não consigo reproduzir".

```
# sem Vary: o cache trata as duas requisições como a mesma entrada
GET /artigo/x    User-Agent: SomeLinkPreviewBot   -> HTML enxuto  (cacheado)
GET /artigo/x    User-Agent: Mozilla/5.0 ...       -> serve o HTML enxuto do cache  ✗
```

## A lição

**Toda resposta cujo corpo (ou headers relevantes) muda em função de um
header da requisição precisa listar esse header em `Vary`.** É o contrato
que diz ao cache "essa entrada só serve para requisições com o mesmo valor
deste header".

```
Vary: User-Agent
```

Mas `Vary` tem custo e armadilhas — não basta adicionar e esquecer:

1. **`Vary: User-Agent` fragmenta o cache de forma agressiva.** Existem
   dezenas de milhares de strings de User-Agent distintas; cada uma vira
   uma entrada separada. A taxa de acerto do cache despenca e a origem
   recebe muito mais carga. Se puder, negocie por um sinal de baixa
   cardinalidade em vez do UA cru (ex.: um header `X-Is-Bot: 1` que seu
   edge/proxy define depois de classificar, e aí `Vary: X-Is-Bot`).

2. **Alternativa mais limpa: separe as representações por URL.** Sirva o
   HTML pra bots em outro caminho (`/prerender/artigo/x`) ou faça o proxy
   rotear o bot pra lá internamente. URLs distintas não precisam de `Vary`
   e cada uma cacheia com folga.

3. **Se a variante não deve ser cacheada compartilhadamente**, seja
   explícito: `Cache-Control: private` (só cache do navegador) ou
   `no-store` na rota negociada, em vez de confiar só no `Vary`.

4. **Alguns caches ignoram ou "achatam" `Vary` por padrão** (especialmente
   `Vary: User-Agent`, `Vary: Cookie`, ou qualquer `Vary` junto de
   `Set-Cookie`). Confirme o comportamento do CDN/proxy específico que você
   usa — não presuma que ele respeita.

5. **`Vary: *`** diz "nunca reutilize esta resposta em cache" — é uma opção
   válida quando a variação não é capturável por um header único.

## Como testar (a parte que quase sempre falta)

`curl` direto na origem não vê o problema — ele só aparece com um cache
compartilhado no meio. Reproduza o caminho real:

```sh
URL="https://exemplo/artigo/x"

# 1. esquenta o cache como bot
curl -s -A "SomeLinkPreviewBot/1.0" "$URL" -o /tmp/a.html -D /tmp/a.hdr

# 2. logo em seguida, pede como navegador
curl -s -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" "$URL" \
  -o /tmp/b.html -D /tmp/b.hdr

# 3. as duas respostas têm que ser DIFERENTES; se forem iguais, o cache
#    serviu a variante errada
diff <(head -c 400 /tmp/a.html) <(head -c 400 /tmp/b.html) \
  && echo "SUSPEITO: mesma resposta pras duas UAs" \
  || echo "ok: variantes distintas"

# 4. confira o Vary e o status de cache nos headers
grep -iE '^(vary|cache-control|age|x-cache|cf-cache-status):' /tmp/a.hdr /tmp/b.hdr
```

Inverta a ordem (esquentar como navegador primeiro) e repita — o bug pode
manifestar só num dos sentidos. Teste também depois de um deploy que mexeu
em cache/proxy, e com o UA real do bot que você quer atender (verifique a
documentação dele), não um genérico.

## Checklist

- [ ] Alguma rota devolve corpo/headers diferentes por `User-Agent`,
      `Accept`, `Accept-Language`, `Accept-Encoding` ou `Cookie`?
- [ ] Essa rota manda o `Vary` correspondente?
- [ ] O header usado no `Vary` é de baixa cardinalidade, ou dá pra trocar
      por um sinal derivado (`X-Is-Bot`) ou por URLs separadas?
- [ ] O CDN/proxy que você usa respeita esse `Vary`? (testado, não presumido)
- [ ] Variantes que não devem ser compartilhadas usam `Cache-Control:
      private`/`no-store`?
- [ ] Existe um teste (manual ou automatizado) que esquenta o cache com uma
      variante e confirma que a outra ainda vem certa — nos dois sentidos?
