Fornecido como está, sem garantias de qualquer tipo. Leia, entenda e adapte
antes de usar. Não nos responsabilizamos por qualquer dano ou mau
funcionamento decorrente do uso deste conteúdo.

# Cartão de preview de link (Open Graph) dinâmico por entidade

## O problema que isso resolve

Um site com várias páginas de conteúdo (posts, produtos, eventos, perfis...)
que compartilham o mesmo arquivo estático de imagem `og:image` perde a
função real do preview de link: quando alguém cola a URL no WhatsApp/X/
Telegram/Slack, todo mundo vê o mesmo cartão genérico, sem título nem
qualquer sinal de qual conteúdo é aquele. Nada quebra tecnicamente — a
página carrega, o preview aparece — só que o preview não diferencia nada,
e ninguém percebe até comparar o link de duas páginas diferentes lado a
lado.

## A ideia central

Gerar a imagem de preview por entidade, sob demanda, em vez de manter um
arquivo estático único:

1. Um endpoint recebe o identificador da entidade (slug, id) e busca os
   campos que vão aparecer no cartão (título, data, categoria, o que fizer
   sentido).
2. Monta um SVG simples em memória (retângulo de fundo, texto do título
   com quebra de linha e truncamento, rodapé com metadado curto).
3. Rasteriza o SVG pra PNG (`sharp`, `resvg`, ou equivalente da sua
   stack) e devolve com `Content-Type: image/png`.
4. Toda referência a `og:image`/JSON-LD que hoje aponta pro arquivo
   estático passa a apontar pra esse endpoint — **nas duas camadas que
   normalmente existem em paralelo**: o HTML pré-renderizado servido a
   bots/crawlers E as meta tags injetadas client-side depois da
   hidratação. Atualizar só uma e esquecer a outra reproduz a mesma
   divergência silenciosa de "duas implementações da mesma coisa que
   fingem estar sincronizadas" (ver lição irmã: meta-tags-duplicadas-
   entre-prerender-e-client-side).

## Wrap de texto sem medir glifo de verdade

Rasterizar SVG server-side normalmente não dá acesso a uma medição real de
largura de texto (sem canvas/DOM disponível). Wrap por contagem de
caracteres é uma estimativa, não pixel-perfect — suficiente pra um cartão
de preview, desde que você: (a) trunque com reticência quando o texto não
couber no número máximo de linhas, e (b) reduza o tamanho da fonte
conforme o título cresce, em vez de deixar ele estourar a largura do
cartão. Teste com um título bem curto e um bem longo (maior que o dobro do
esperado) antes de considerar pronto — é o caso que mais quebra layout.

## Cache

Cachear a imagem gerada (`Cache-Control: public, max-age=...`) evita
rasterizar de novo a cada preview de link. Cuidado com `immutable`: se o
conteúdo que alimenta a imagem (título, data) puder ser corrigido depois
de publicado, `immutable` faz clientes que já cachearam a versão velha
nunca verem a correção dentro do período de cache — prefira um `max-age`
sem `immutable`, ou invalide por versão/hash se o conteúdo mudar com
frequência.

## Checklist

- [ ] Endpoint novo gera a imagem sob demanda a partir do identificador da
      entidade (não reaproveita um arquivo estático fixo)
- [ ] Wrap de título trunca com reticência e reduz fonte pra título longo —
      testado com título curto e título 2x mais longo que o normal
- [ ] `og:image`/JSON-LD atualizados nas duas camadas: prerender (HTML
      servido a bot) E client-side (meta tag injetada após hidratação)
- [ ] 404 tratado explicitamente quando o identificador não existe (não
      deixe a rasterização quebrar com dado vazio)
- [ ] Cache-Control definido de propósito — sem `immutable` se o conteúdo
      puder ser corrigido depois de publicado
- [ ] Teste real: cole a URL de duas entidades diferentes num app que
      renderiza preview (WhatsApp Web, debugger de card do X/Twitter,
      etc.) e confirme que os dois cartões são visivelmente diferentes

## Esqueleto de código (Node.js + sharp, adapte pra sua stack)

```js
const WIDTH = 1200
const HEIGHT = 630

function wrapTitle(title, maxLines = 4) {
  const words = title.split(/\s+/).filter(Boolean)
  const fontSize = title.length > 90 ? 44 : title.length > 60 ? 52 : 60
  const charsPerLine = Math.max(10, Math.floor(1020 / (fontSize * 0.56)))
  const lines = []
  let current = ''
  let idx = 0
  while (idx < words.length && lines.length < maxLines) {
    const word = words[idx]
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > charsPerLine && current) {
      lines.push(current)
      current = ''
      continue
    }
    current = candidate
    idx += 1
  }
  if (current && lines.length < maxLines) lines.push(current)
  if (idx < words.length) {
    const last = lines.length - 1
    lines[last] = `${lines[last].replace(/[.,;:…]+$/, '')}…`
  }
  return { lines, fontSize }
}

function buildOgSvg({ title, footer }) {
  const { lines, fontSize } = wrapTitle(title || '')
  const lineHeight = Math.round(fontSize * 1.28)
  const startY = Math.round(HEIGHT / 2 - ((lines.length - 1) * lineHeight) / 2 - 10)
  const titleLines = lines
    .map((line, i) => `<text x="90" y="${startY + i * lineHeight}" font-size="${fontSize}" fill="#fff">${escapeXml(line)}</text>`)
    .join('\n')
  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#111" />
${titleLines}
<text x="90" y="${HEIGHT - 60}" font-size="24" fill="#aaa">${escapeXml(footer || '')}</text>
</svg>`
}

// rota exemplo (Express)
app.get('/api/og/:id.png', async (req, res) => {
  const entity = await findEntityById(req.params.id) // sua busca real
  if (!entity) return res.status(404).send('not found')
  const svg = buildOgSvg({ title: entity.title, footer: entity.footerLabel })
  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  res.set('Content-Type', 'image/png')
  res.set('Cache-Control', 'public, max-age=86400') // sem immutable se o conteúdo pode ser corrigido
  res.send(png)
})
```
