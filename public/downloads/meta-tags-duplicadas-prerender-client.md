# Nota: meta tag escrita em dois lugares diverge sem nenhum erro avisar

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Uma SPA com caminho de pré-renderização pra bots (crawler de busca, preview
de link em rede social) normalmente tem **duas rotinas independentes**
escrevendo o mesmo conjunto de meta tags de compartilhamento (Open Graph,
Twitter Card, `article:*`) pra uma mesma página:

- uma no template server-side, montado pro bot que não executa JavaScript;
- outra em JavaScript, injetada no `<head>` depois da hidratação, pra quando
  um navegador real (ou qualquer ferramenta que executa JS) carrega a SPA.

As duas nascem idênticas — foram escritas olhando uma pra outra. O problema
aparece na primeira mudança depois disso: um campo novo (`og:locale`,
`article:published_time`, `article:modified_time`, o que for) é adicionado
só numa das duas rotinas, porque quem mexeu lembrou de um caminho e esqueceu
do outro. Nada quebra — a página carrega normal dos dois jeitos, o preview
pro bot que só lê HTML cru continua completo, só a versão renderizada no
navegador (e qualquer prévia gerada a partir dela) fica com o metadado pela
metade. Não existe erro de console, nem 404, nem diferença visível pra quem
olha a página — só um `<meta>` que deveria estar lá e não está, invisível a
menos que alguém compare as duas fontes campo a campo.

## A lição

Duas implementações da "mesma" coisa (meta tags, mas o padrão vale pra rota,
validação, texto de erro) que vivem em arquivos/linguagens diferentes por
causa de dois caminhos de render (server vs. client) não são uma coincidência
inofensiva — são duplicação com prazo de validade. Regras práticas:

1. **Uma função/lista única como fonte de verdade, sempre que der.** Se o
   template server-side e a rotina client-side puderem compartilhar a mesma
   definição de campos (mesmo módulo, ou pelo menos os dois lendo da mesma
   lista de nomes), a divergência deixa de ser possível por construção.
2. **Onde não dá pra compartilhar código** (linguagens/processos diferentes,
   ex. template Node no servidor vs. módulo de browser), documente as duas
   implementações lado a lado com a lista exata de campos que uma precisa
   espelhar da outra — comentário apontando pro outro arquivo, não memória de
   quem escreveu.
3. **Teste automatizado que compara as duas saídas pra mesma URL.** Busque a
   versão "bot" (`curl` com User-Agent de crawler) e a versão "client"
   (browser headless depois de hidratar) e assegure que os dois conjuntos de
   meta tags relevantes batem. Isso transforma "campo esquecido" em falha de
   CI no momento em que é adicionado, não em lacuna descoberta meses depois.
4. **Trate qualquer PR que mexe num dos dois caminhos como candidato a mexer
   no outro também** — não é motivo pra bloquear o PR sozinho, é motivo pra
   checklist.

```sh
#!/usr/bin/env sh
# Compara os meta tags <meta property="..."> entre o HTML servido a um bot
# (sem JS) e o HTML depois de hidratado num browser headless.
# Requer: curl, node com puppeteer instalado no projeto (ajuste o caminho).
set -eu

URL="$1"
BOT_UA="${2:-Twitterbot/1.0}"

echo "== meta tags no HTML pro bot (sem JS) =="
BOT_META=$(curl -sS -A "$BOT_UA" "$URL" \
  | grep -oiE '<meta[^>]+property="(og|article):[a-z_:]+"[^>]*>' \
  | sort)
printf '%s\n' "$BOT_META"

echo "== meta tags depois de hidratar (via Node/Puppeteer) =="
CLIENT_META=$(node -e '
  const puppeteer = require("puppeteer");
  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(process.argv[1], { waitUntil: "networkidle0" });
    const tags = await page.$$eval(
      "meta[property^=\"og:\"], meta[property^=\"article:\"]",
      (els) => els.map((e) => e.outerHTML).sort()
    );
    console.log(tags.join("\n"));
    await browser.close();
  })();
' "$URL" | sort)
printf '%s\n' "$CLIENT_META"

if [ "$BOT_META" != "$CLIENT_META" ]; then
  echo "FALHA: meta tags divergem entre pré-render (bot) e client-side hidratado"
  exit 1
fi
echo "OK: os dois caminhos concordam"
```

## Checklist ao adicionar um campo de meta tag novo

- [ ] O campo foi adicionado nas duas rotinas (server-side/pré-render e
      client-side/hidratação), não só numa?
- [ ] Existe uma lista/função única de campos que as duas leem, ou pelo
      menos um comentário em cada arquivo apontando pro outro?
- [ ] Um teste automatizado compara as duas saídas pra mesma URL e falha se
      divergirem?
- [ ] O teste roda no CI, não só manualmente antes de um deploy específico?
