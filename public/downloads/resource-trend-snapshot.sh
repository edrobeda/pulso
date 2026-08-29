#!/usr/bin/env bash
#
# ⚠️ AVISO LEGAL: este script é fornecido "como está", sem garantias de
# qualquer tipo, extraído e adaptado de um caso real para uso genérico.
# Não foi testado no seu ambiente. Leia, entenda e adapte antes de usar
# em produção. O autor não se responsabiliza por qualquer dano, perda de
# dados ou mau funcionamento decorrente do uso deste conteúdo.
#
# Template de monitoramento de tendência: mede um recurso, grava a
# medição como uma linha nova de histórico (nunca sobrescreve a
# anterior) e calcula a taxa de crescimento entre a primeira e a última
# leitura da janela, avisando se a tendência é preocupante.
#
# Lição por trás: um valor isolado ("hoje está em 84%") não avisa nada
# sozinho — só vira alerta útil quando comparado com o histórico. E
# quando o recurso que te preocupa está fora do seu acesso/permissão
# (ex.: disco do host, compartilhado com outros serviços), meça uma
# proxy que você controla e que tende a crescer junto — não é o dado
# exato, mas dá alerta antecipado sem exigir um acesso que você não tem.
#
# Uso: adapte as variáveis e a função `measure` abaixo, chame pelo cron
# com frequência regular (ex. diária), ex.:
#   0 6 * * * /caminho/para/resource-trend-snapshot.sh >> /caminho/log.log 2>&1

set -euo pipefail

HISTORY_FILE="/caminho/para/resource-history.csv"   # <-- ajuste
WINDOW_SIZE=14                                       # <-- quantas leituras recentes considerar pra tendência
WARN_GROWTH_PERCENT=20                               # <-- avisa se cresceu mais que isso (%) na janela
TIMESTAMP="$(date -u +%FT%TZ)"

# --- Ajuste esta função pro recurso real que você quer acompanhar ---
# Deve imprimir só um número (bytes, contagem, o que fizer sentido).
# Exemplos de proxy quando o recurso real está fora do seu escopo:
#   - tamanho do seu próprio banco:   psql -tAc "SELECT pg_database_size('seu_banco')"
#   - tamanho da sua própria pasta:   du -sb /caminho/da/sua/pasta | cut -f1
#   - linhas numa tabela que cresce:  psql -tAc "SELECT count(*) FROM sua_tabela"
measure() {
  du -sb /caminho/para/monitorar | cut -f1   # <-- ajuste
}

VALUE="$(measure)"

mkdir -p "$(dirname "$HISTORY_FILE")"
touch "$HISTORY_FILE"
echo "${TIMESTAMP},${VALUE}" >> "$HISTORY_FILE"

# --- Calcula tendência dentro da janela recente ---

WINDOW_LINES="$(tail -n "$WINDOW_SIZE" "$HISTORY_FILE")"
FIRST_VALUE="$(echo "$WINDOW_LINES" | head -n1 | cut -d',' -f2)"
LINE_COUNT="$(echo "$WINDOW_LINES" | wc -l)"

echo "$(date -u +%FT%TZ) medição atual: ${VALUE} (${LINE_COUNT} leituras na janela, primeira: ${FIRST_VALUE})"

if [ "$LINE_COUNT" -lt 2 ]; then
  echo "$(date -u +%FT%TZ) histórico ainda curto pra calcular tendência — só a leitura de hoje foi gravada."
  exit 0
fi

if [ "$FIRST_VALUE" -le 0 ]; then
  echo "$(date -u +%FT%TZ) primeira leitura da janela é zero/negativa — pulando cálculo de tendência."
  exit 0
fi

GROWTH_PERCENT=$(( (VALUE - FIRST_VALUE) * 100 / FIRST_VALUE ))

echo "$(date -u +%FT%TZ) crescimento na janela: ${GROWTH_PERCENT}% (limiar de aviso: ${WARN_GROWTH_PERCENT}%)"

if [ "$GROWTH_PERCENT" -ge "$WARN_GROWTH_PERCENT" ]; then
  echo "$(date -u +%FT%TZ) ALERTA: tendência de crescimento acima do limiar — investigue antes que vire incidente."
  # substitua pela sua notificação real (webhook, e-mail, registro em algum lugar visível, etc.)
  # notify.sh "recurso crescendo ${GROWTH_PERCENT}% na janela de ${WINDOW_SIZE} leituras"
  exit 1
fi

echo "$(date -u +%FT%TZ) tendência dentro do esperado."
