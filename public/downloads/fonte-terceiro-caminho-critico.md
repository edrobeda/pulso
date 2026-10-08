# Fonte de terceiro no caminho crítico soma um handshake inteiro antes do texto certo aparecer

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de um caso real para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Carregar fonte via `<link rel="stylesheet" href="https://fonts.googleapis.com/...">`
(ou qualquer CDN de fonte de terceiro) parece gratuito — é só uma linha no
`<head>`. Mas antes do navegador conseguir aplicar aquela fonte, ele precisa
abrir uma conexão nova: DNS + TLS handshake pra um domínio que não é o seu,
no meio do caminho crítico da primeira renderização. Em banda larga isso é
imperceptível; em conexão de celular (o perfil de leitura real de boa parte
do público de um blog) é tempo real de espera antes do texto aparecer com a
tipografia certa — e ainda cria uma dependência de disponibilidade de um
serviço externo só pra renderizar texto.

## A lição

Self-hospede os arquivos de fonte (`.woff2`) no seu próprio domínio, servidos
como qualquer outro estático, com cache longo (`max-age=31536000, immutable`
— o arquivo não muda depois de baixado uma vez). Isso elimina a conexão
cross-origin do caminho crítico: resta só a conexão que o navegador já ia
abrir com o seu próprio domínio de qualquer forma.

Pontos que valem atenção ao migrar de um CDN de fonte pra self-hospedado:

- **Baixe o subset certo, não o arquivo completo.** A maioria dos CDNs de
  fonte serve por `unicode-range` (latin, latin-ext, cyrillic...). Pra um
  site em português, o subset `latin` já cobre toda a acentuação — não baixe
  o pacote de todos os idiomas só por comodidade; isso infla o download sem
  necessidade.
- **Mantenha o `unicode-range` na declaração `@font-face` local**, copiado do
  CSS original do CDN. Ele é o que permite ao navegador decidir, sem baixar
  nada, se aquele arquivo serve pro texto da página — não é decoração.
- **`font-display: swap`** evita bloquear a renderização do texto esperando
  a fonte custom carregar — mostra a fonte de fallback imediatamente e troca
  quando a custom chega. Sem isso, texto pode ficar invisível por um tempo
  (FOIT) em conexão lenta.
- **Um arquivo por combinação real de peso/estilo usada no site**, não um
  arquivo por peso que a fonte oferece. Se o CSS só usa `font-weight: 500` e
  `700` de uma família variável, um único arquivo variável cobrindo esse
  intervalo (`font-weight: 500 700` na declaração) substitui dois arquivos
  estáticos.
- **Teste depois de migrar**: a URL antiga do CDN não deve mais aparecer em
  nenhuma aba de rede do navegador pra aquela página, e o texto deve
  continuar com a tipografia certa (comparar visualmente ou via
  `document.fonts` no devtools).

## Checklist rápido

1. [ ] Baixar o `.woff2` de cada família/peso/estilo realmente usado
   (ferramenta tipo `google-webfonts-helper` ou direto da fonte oficial),
   subset latin (ou o subset certo pro seu idioma).
2. [ ] Copiar as declarações `@font-face` do CSS do CDN, trocar só o `src`
   pra apontar pro arquivo local (`/fonts/arquivo.woff2`), manter
   `unicode-range` e `font-display: swap`.
3. [ ] Servir os arquivos com cache de 1 ano (`Cache-Control: public,
   max-age=31536000, immutable`) — nome de arquivo estável, conteúdo nunca
   muda depois de publicado.
4. [ ] Remover o `<link>`/`@import` pro domínio do CDN de fonte.
5. [ ] Confirmar na aba de rede: zero requisição pro domínio antigo, texto
   com a fonte certa.
