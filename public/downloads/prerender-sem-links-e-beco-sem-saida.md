# Nota: a página que você renderiza só pro crawler não pode ser um beco sem saída

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Uma SPA (ou qualquer app onde a navegação é montada por JavaScript) muitas
vezes ganha um caminho de renderização paralelo só pra quem **não executa
JS**: um HTML pré-renderizado no servidor pros bots de indexação e de
preview de link, uma página AMP, um fallback de SSR, uma "versão de
impressão". Esse caminho normalmente é construído a partir de um template
mínimo: `<title>`, meta tags, Open Graph, JSON-LD e o corpo do conteúdo.

O que quase sempre falta nesse template são os **links de navegação** que,
no app normal, o JavaScript injeta em volta do conteúdo — menu, "anterior /
próximo", "relacionados", breadcrumb, link pra home. O resultado é um
documento que tem o conteúdo certo e **um único link: pra ele mesmo** (a URL
canônica). Um crawler que cai ali por um link externo lê a página e não tem
para onde ir — não descobre nenhuma outra página do site a partir dela.

Nada dá erro. A página responde 200, o preview de link fica bonito, o
conteúdo indexa. Só que o grafo de links que o crawler enxerga tem esse nó
desconectado de todo o resto, e as páginas que só eram alcançáveis por
navegação interna demoram muito mais pra serem descobertas — ou não são.

```html
<!-- o que costuma sair do pré-render: conteúdo ok, zero navegação -->
<article>
  <h1>Título do conteúdo</h1>
  <p>corpo inteiro...</p>
</article>
<!-- fim. nenhum <a href> pra outro lugar do site -->
```

## A lição

O caminho de renderização pro bot é uma **representação alternativa do
site**, não só do conteúdo daquela página. Ele precisa carregar, em HTML
real (`<a href>` com URL absoluta, não `onclick`/`router.push`), pelo menos:

- link pra home / seção pai;
- navegação sequencial quando existir (anterior / próximo);
- alguns links relacionados (mesma lógica que o app usa pra montar o bloco
  "relacionados" — reaproveite, não reinvente);
- breadcrumb, se o app tem um.

Regras práticas:

1. **Trate "sem links de saída" como bug de build, não como detalhe.** Uma
   página sem nenhum link interno é um beco sem saída pra qualquer crawler.
2. **Use URLs absolutas e resolvíveis.** O bot pode não ter a mesma `<base>`
   nem resolver caminhos relativos como o navegador.
3. **Derive os links da mesma fonte que o app usa.** Se o front calcula
   "relacionados por tag em comum", o pré-render deve chamar a mesma função
   / query — senão as duas representações divergem com o tempo.
4. **Teste como o bot, não como você.** `curl` com o User-Agent de um bot de
   preview e conte os links de saída; se vier só a URL canônica, o template
   está incompleto.

```sh
#!/usr/bin/env sh
# quantos links internos DISTINTOS (fora a própria URL) o HTML pro bot expõe?
URL="$1"
BOT_UA="${2:-Twitterbot/1.0}"
HOST=$(printf '%s\n' "$URL" | sed -E 's#^(https?://[^/]+).*#\1#')

html=$(curl -sS -A "$BOT_UA" "$URL")

printf '%s\n' "$html" \
  | grep -oiE 'href="[^"#]+"' \
  | sed -E 's/^href="//I; s/"$//' \
  | sed -E "s#^/#$HOST/#" \
  | grep -E "^$HOST/" \
  | grep -vxF "$URL" \
  | sort -u > /tmp/prerender_links.txt

n=$(wc -l < /tmp/prerender_links.txt | tr -d ' ')
echo "links internos de saída: $n"
cat /tmp/prerender_links.txt
[ "$n" -ge 2 ] || { echo "FALHA: pré-render é um beco sem saída (só linka pra si mesmo)"; exit 1; }
```

## Checklist ao criar/revisar um caminho de render pra bot sem JS

- [ ] O HTML tem `<a href>` real pra home ou seção pai?
- [ ] Tem navegação sequencial (anterior/próximo) quando o conteúdo é uma
      série ou cronologia?
- [ ] Tem um punhado de links relacionados, derivados da mesma lógica do app?
- [ ] Todos os `href` são absolutos e abrem sozinhos (sem depender de JS)?
- [ ] Existe um teste/smoke que falha se a página vier com menos de N links
      internos de saída?
- [ ] A lista de User-Agents que recebe esse HTML cobre os crawlers de busca
      e de IA atuais, não só os bots de preview de rede social?
