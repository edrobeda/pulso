#!/usr/bin/env bash
#
# ⚠️ AVISO LEGAL: este script é fornecido "como está", sem garantias de
# qualquer tipo, extraído e adaptado de um caso real para uso genérico.
# Não foi testado no seu ambiente. Leia, entenda e adapte antes de usar
# em produção. O autor não se responsabiliza por qualquer dano, perda de
# dados, indisponibilidade ou mau funcionamento decorrente do uso deste
# conteúdo — a responsabilidade de validar é sempre de quem executa.
#
# ---------------------------------------------------------------------------
# O problema que isso resolve
# ---------------------------------------------------------------------------
# Quando um proxy reverso (nginx, e vários outros) resolve o hostname do
# upstream UMA vez — no carregamento da config — e guarda o IP, ele continua
# mandando tráfego pro IP antigo depois que o container do backend é
# recriado (`docker compose up -d`, `kubectl rollout`, deploy azul/verde) e
# ganha um IP novo. Durante essa janela — normalmente de alguns segundos até
# o TTL do resolver expirar, ou indefinidamente se não houver `resolver`
# configurado — a URL pública devolve 502/503/504 (ou um 404 vindo de outra
# camada que assume o lugar). Nada "quebra" de forma permanente: some
# sozinho. Isso cria dois enganos simétricos:
#
#   1. O smoke test que roda no primeiro segundo depois do `up -d` pega um
#      erro TRANSITÓRIO e reporta o deploy como falho (falso negativo) —
#      ou pior, dispara um rollback automático de um deploy que estava bom.
#   2. Ninguém testa nesse intervalo, o teste passa depois, e o fato de que
#      usuários reais tomaram erro por 30s nunca aparece em lugar nenhum.
#
# ---------------------------------------------------------------------------
# A correção de raiz (faça isto ANTES de depender do script abaixo)
# ---------------------------------------------------------------------------
# Elimine a janela em vez de só medir ela:
#
#   * nginx: force resolução em tempo de request usando uma variável no
#     `proxy_pass` + a diretiva `resolver` apontando pro DNS interno
#     (no Docker, 127.0.0.11):
#
#         resolver 127.0.0.11 valid=10s ipv6=off;
#         set $upstream http://meu-servico-backend:3000;
#         location /api/ {
#             proxy_pass $upstream;
#         }
#
#     (com a variável, o nginx NÃO valida o host no boot e volta a resolver
#     conforme o TTL — o `valid=` limita o cache; sem a variável ele
#     resolve uma vez e nunca mais.)
#
#   * Alternativa/reforço: recarregue o proxy DEPOIS que o novo container
#     estiver de pé e saudável (`nginx -s reload` / `docker compose exec
#     proxy nginx -s reload`), não antes.
#
#   * Melhor ainda: healthcheck no container do backend + o proxy só
#     recebendo tráfego pro novo alvo quando ele passa a responder
#     (`depends_on: condition: service_healthy`, ou um load balancer com
#     drain/connection draining no alvo antigo).
#
#   * Suba o novo antes de derrubar o antigo (rolling), pra nunca existir
#     um instante com zero backend vivo pro IP que o proxy conhece.
#
# ---------------------------------------------------------------------------
# O que este script faz
# ---------------------------------------------------------------------------
# Roda uma verificação pós-deploy que separa "ainda estabilizando" de
# "quebrado de verdade": faz polling com backoff por até GRACE_SECONDS,
# tratando erro como transitório enquanto está dentro da janela, e SÓ
# falha (exit != 0) se o erro persistir depois dela. Também reporta se
# houve QUALQUER janela de indisponibilidade — porque uma janela de 30s a
# cada deploy é um bug de cutover a corrigir, não um custo aceitável.
#
# Uso:
#   ./deploy-cutover-recheck.sh https://seu-dominio.exemplo
#   BASE_URL=https://... GRACE_SECONDS=45 ./deploy-cutover-recheck.sh
#
# Rode logo depois do `up -d` / rollout. Ajuste PATHS pras rotas que
# atravessam o proxy até o backend recriado (as estáticas não servem —
# elas não exercitam o proxy_pass).

set -euo pipefail

BASE_URL="${1:-${BASE_URL:-https://seu-dominio.exemplo}}"   # ajuste ou passe como argumento
GRACE_SECONDS="${GRACE_SECONDS:-30}"   # janela tolerada de estabilização pós-cutover
POLL_INTERVAL="${POLL_INTERVAL:-2}"    # segundos entre tentativas (teto de backoff)
STABLE_STREAK="${STABLE_STREAK:-3}"    # respostas boas seguidas pra declarar estável
TIMEOUT="${TIMEOUT:-5}"                # timeout por request (curl --max-time)

# Rotas que passam PELO proxy até o backend dinâmico. Inclua pelo menos uma
# que dependa do container recriado (ex.: um /health da API).
PATHS=(
  "/api/health"
  "/"
)

# Códigos que contam como "backend ainda não assumiu" durante a janela.
# 502/503/504 = proxy sem upstream vivo; 404 aqui costuma ser outra camada
# respondendo no lugar do backend ausente. Ajuste se no seu setup um 404
# for legítimo pra alguma rota da lista.
is_transient() {
  case "$1" in
    000|502|503|504|404) return 0 ;;
    *) return 1 ;;
  esac
}

probe() {
  # ecoa só o status HTTP (000 se nem conectou)
  curl -s -o /dev/null -w '%{http_code}' --max-time "$TIMEOUT" "$1" || echo 000
}

overall_fail=0

for path in "${PATHS[@]}"; do
  url="${BASE_URL%/}${path}"
  start="$(date +%s)"
  streak=0
  saw_outage=0
  outage_seconds=0
  last_code=""

  while :; do
    code="$(probe "$url")"
    now="$(date +%s)"
    elapsed=$(( now - start ))

    if [ "$code" = "200" ]; then
      streak=$(( streak + 1 ))
      if [ "$streak" -ge "$STABLE_STREAK" ]; then
        if [ "$saw_outage" -eq 1 ]; then
          printf '%-16s ESTÁVEL após ~%ss de janela transitória (último erro: %s)\n' \
            "$path" "$outage_seconds" "$last_code"
          echo "   ^^ houve indisponibilidade real no cutover — corrija o proxy"
          echo "      (resolver dinâmico / reload pós-health / rolling), não só tolere."
        else
          printf '%-16s OK — cutover sem janela de erro\n' "$path"
        fi
        break
      fi
    else
      streak=0
      last_code="$code"
      if [ "$saw_outage" -eq 0 ]; then saw_outage=1; fi
      outage_seconds="$elapsed"

      if [ "$elapsed" -ge "$GRACE_SECONDS" ]; then
        if is_transient "$code"; then
          printf '%-16s FALHA — erro %s ainda presente após %ss (> janela de %ss)\n' \
            "$path" "$code" "$elapsed" "$GRACE_SECONDS"
          echo "   ^^ não é mais transitório: upstream não subiu, DNS não atualizou,"
          echo "      ou a config do proxy está apontando pro lugar errado."
        else
          printf '%-16s FALHA — status %s (não é erro de cutover conhecido)\n' \
            "$path" "$code"
        fi
        overall_fail=1
        break
      fi
    fi

    # backoff simples até POLL_INTERVAL
    sleep "$POLL_INTERVAL"
  done
done

echo
if [ "$overall_fail" -ne 0 ]; then
  echo "RESULTADO: deploy NÃO validado — veja as linhas FALHA acima."
  exit 1
fi
echo "RESULTADO: todas as rotas estabilizaram dentro da janela."
echo "Se alguma acusou 'janela transitória', trate como bug de cutover a corrigir."
