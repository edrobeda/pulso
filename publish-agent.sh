#!/bin/bash
# Agente do Pulso — disparado via cron do usuário blog-bot às 11:00 e 16:00
# UTC (= 08:00 e 13:00 horário de Brasília). Só deve tocar em
# /home/blog-bot/blog (ver .agent-prompt.md pro escopo completo).
set -uo pipefail

cd /home/blog-bot/blog || exit 1

LOG_DIR="/home/blog-bot/blog/.agent-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d_%H-%M-%S).log"

DATE_BR=$(TZ='America/Sao_Paulo' date +%F)
HOUR_BR=$(TZ='America/Sao_Paulo' date +%H)
if [ "$HOUR_BR" -lt 12 ]; then SLOT="08:00"; else SLOT="13:00"; fi

rm -f .last-run.json

CONTEXT="## Contexto desta rodada
Data de hoje (horário de Brasília): $DATE_BR
Horário deste pulso: $SLOT

"
PROMPT="${CONTEXT}$(cat /home/blog-bot/blog/.agent-prompt.md)"

RAW_JSON="$LOG_DIR/.publish-raw-$(date +%Y-%m-%d_%H-%M-%S).json"

/home/blog-bot/.local/bin/claude -p "$PROMPT" \
    --model claude-sonnet-5 \
    --effort high \
    --allow-dangerously-skip-permissions \
    --permission-mode bypassPermissions \
    --output-format json \
    > "$RAW_JSON" 2>"$LOG_FILE"
CLAUDE_EXIT=$?

# --output-format json devolve um objeto único no final (não mais o texto
# corrido de antes) — extrai só o campo de resumo (.result) pro log
# continuar legível, e usa o resto do objeto (.usage/.total_cost_usd) pra
# registrar custo real da rodada (mesmo padrão do infra-agent.sh, ver
# MEETING.md 2026-08-02).
jq -r '.result // "(sem resultado — ver exit code '"$CLAUDE_EXIT"')"' "$RAW_JSON" >> "$LOG_FILE" 2>/dev/null

echo "$(date -Iseconds) — rodada $SLOT concluída (exit $CLAUDE_EXIT), log em $LOG_FILE" >> "$LOG_DIR/runs.log"

if [ -s "$RAW_JSON" ]; then
    # shellcheck disable=SC1091
    source .env
    INPUT_TOKENS=$(jq -r '.usage.input_tokens // 0' "$RAW_JSON" 2>/dev/null)
    OUTPUT_TOKENS=$(jq -r '.usage.output_tokens // 0' "$RAW_JSON" 2>/dev/null)
    CACHE_READ=$(jq -r '.usage.cache_read_input_tokens // 0' "$RAW_JSON" 2>/dev/null)
    CACHE_CREATE=$(jq -r '.usage.cache_creation_input_tokens // 0' "$RAW_JSON" 2>/dev/null)
    COST_USD=$(jq -r '.total_cost_usd // 0' "$RAW_JSON" 2>/dev/null)
    DURATION_MS=$(jq -r '.duration_ms // 0' "$RAW_JSON" 2>/dev/null)
    docker exec -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB psql -U "$BLOG_DB_USER" -d "$BLOG_DB_NAME" -c \
        "INSERT INTO round_usage (agent, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, cost_usd, duration_ms)
         VALUES ('publicacao', ${INPUT_TOKENS:-0}, ${OUTPUT_TOKENS:-0}, ${CACHE_READ:-0}, ${CACHE_CREATE:-0}, ${COST_USD:-0}, ${DURATION_MS:-0})" \
        >> "$LOG_DIR/runs.log" 2>&1 \
        || echo "$(date -Iseconds) — aviso: falha ao registrar uso de tokens desta rodada" >> "$LOG_DIR/runs.log"
fi
rm -f "$RAW_JSON"

CONTAINER_UP=$(docker ps --filter "name=DK_BLOG" --filter "status=running" -q)

# NOTIFICAÇÃO: ver notify.sh (chamado a partir daqui, mantido em arquivo
# separado por conter o envio via WhatsApp).
/home/blog-bot/blog/notify.sh "$CLAUDE_EXIT" "$CONTAINER_UP" "$SLOT" "$LOG_FILE"
