#!/usr/bin/env bash
#
# ⚠️ AVISO LEGAL: este script é fornecido "como está", sem garantias de
# qualquer tipo, extraído e adaptado de um caso real para uso genérico.
# Não foi testado no seu ambiente. Leia, entenda e adapte antes de usar
# em produção. O autor não se responsabiliza por qualquer dano, perda de
# dados ou mau funcionamento decorrente do uso deste conteúdo.
#
# Verifica, pela borda pública (não pela origem), se as respostas de
# texto de um conjunto de URLs estão realmente saindo comprimidas
# (gzip/br/zstd) quando o cliente pede — e mede quanto se perde quando
# não estão.
#
# Lição por trás: pôr um proxy reverso ou CDN na frente NÃO garante
# compressão. É comum o proxy só comprimir os arquivos que ele mesmo
# serve do disco e repassar o corpo do backend dinâmico como veio. Aí
# as respostas de API (JSON, XML, sitemap, feed) vão sem compressão —
# nada dá erro, o payload só cresce em silêncio conforme o conteúdo
# aumenta. Decida qual camada é dona da compressão (middleware do app
# OU config do proxy), ligue explicitamente e confirme no fio.
#
# Armadilhas comuns quando "deveria estar comprimido e não está":
#   - o proxy só comprime estático servido por ele (ex.: `gzip_types`/
#     `encode` que não cobre a rota de proxy_pass);
#   - o Content-Type da resposta não está na lista de tipos compressíveis
#     do proxy (ex.: `application/rss+xml`, `application/xml` faltando);
#   - o upstream já mandou `Content-Encoding: identity` ou um ETag fraco
#     que faz o proxy desistir;
#   - resposta abaixo do tamanho mínimo pra compressão valer a pena
#     (normal: ~1KB) — esperado, não é bug;
#   - proxy remove `Accept-Encoding` do request pro upstream e também
#     não comprime ele mesmo (fica sem ninguém dono);
#   - HTTP/2 + resposta em streaming/chunked que o proxy não bufferiza
#     pra comprimir.
#
# Uso:
#   ./response-compression-check.sh https://seu-dominio.exemplo
# ou defina a lista de PATHS abaixo e rode sem argumento.

set -euo pipefail

BASE_URL="${1:-https://seu-dominio.exemplo}"   # <-- ajuste ou passe como argumento

# Rotas a conferir — inclua as de texto que mais crescem (listas, feeds).
PATHS=(
  "/"
  "/api/posts"
  "/feed.xml"
  "/sitemap.xml"
)

# Tipos que DEVERIAM sair comprimidos acima do tamanho mínimo.
COMPRESSIBLE_RE='text/|application/(json|xml|rss\+xml|atom\+xml|javascript|ld\+json)|image/svg\+xml'
MIN_BYTES=1024          # abaixo disso, não comprimir é aceitável
ACCEPT_ENCODING="gzip, br, zstd"

fail=0

for path in "${PATHS[@]}"; do
  url="${BASE_URL%/}${path}"

  # Cabeçalhos da resposta comprimida (como um browser pediria).
  headers="$(curl -sS -D - -o /dev/null \
    -H "Accept-Encoding: ${ACCEPT_ENCODING}" \
    --compressed "$url" || true)"

  status="$(printf '%s\n' "$headers" | awk 'NR==1{print $2}')"
  ctype="$(printf '%s\n' "$headers" | tr -d '\r' \
    | awk -F': ' 'tolower($1)=="content-type"{print tolower($2); exit}')"
  cenc="$(printf '%s\n' "$headers" | tr -d '\r' \
    | awk -F': ' 'tolower($1)=="content-encoding"{print tolower($2); exit}')"

  # Tamanho real na rede sem compressão (pede identity).
  raw_bytes="$(curl -sS -o /dev/null -w '%{size_download}' \
    -H 'Accept-Encoding: identity' "$url" || echo 0)"
  # Tamanho transferido com compressão.
  gz_bytes="$(curl -sS -o /dev/null -w '%{size_download}' \
    -H "Accept-Encoding: ${ACCEPT_ENCODING}" "$url" || echo 0)"

  is_text=0
  [[ -n "$ctype" && "$ctype" =~ $COMPRESSIBLE_RE ]] && is_text=1

  printf '%-28s status=%s type=%-24s enc=%-8s raw=%sB wire=%sB\n' \
    "$path" "${status:-?}" "${ctype:-?}" "${cenc:-none}" "$raw_bytes" "$gz_bytes"

  if [[ "$is_text" -eq 1 && "$raw_bytes" -ge "$MIN_BYTES" && -z "$cenc" ]]; then
    echo "   ^^ ALERTA: resposta de texto de ${raw_bytes}B saindo SEM Content-Encoding."
    echo "      Confirme qual camada deveria comprimir (app ou proxy) e se o"
    echo "      Content-Type está na lista de tipos compressíveis dessa camada."
    fail=1
  fi
done

if [[ "$fail" -ne 0 ]]; then
  echo
  echo "Uma ou mais rotas de texto não estão comprimidas na borda pública."
  exit 1
fi

echo
echo "OK: todas as rotas de texto acima do mínimo saíram comprimidas."
