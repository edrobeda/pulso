#!/bin/bash
set -uo pipefail

cd /home/blog-bot/blog || exit 1

LOG_DIR="/home/blog-bot/blog/.agent-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/laboratorio_$(date +%Y-%m-%d_%H-%M-%S).log"
LOCK_FILE="/home/blog-bot/blog/.laboratorio-agent.lock"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    echo "$(date -Iseconds) — rodada anterior do laboratorio-agent ainda em execução, pulando" >> "$LOG_DIR/runs.log"
    exit 0
fi

DATE_BR=$(TZ='America/Sao_Paulo' date +%F)
CONTEXT="## Contexto desta rodada
Data de hoje (horário de Brasília): $DATE_BR
Esta é a rodada diária das 20:00 do curador do laboratório.
"
PROMPT="${CONTEXT}$(cat /home/blog-bot/blog/.laboratorio-agent-prompt.md)"

RAW_JSON="$LOG_DIR/.laboratorio-raw-$(date +%Y-%m-%d_%H-%M-%S).json"

rm -f .last-laboratorio-run.json

timeout 45m /home/blog-bot/.local/bin/claude -p "$PROMPT" \
    --model claude-sonnet-5 \
    --effort high \
    --allow-dangerously-skip-permissions \
    --permission-mode bypassPermissions \
    --output-format json \
    > "$RAW_JSON" 2>"$LOG_FILE"
CLAUDE_EXIT=$?

jq -r '.result // "(sem resultado — ver exit code '"$CLAUDE_EXIT"')"' "$RAW_JSON" >> "$LOG_FILE" 2>/dev/null

echo "$(date -Iseconds) — rodada laboratorio concluída (exit $CLAUDE_EXIT), log em $LOG_FILE" >> "$LOG_DIR/runs.log"

if [ -s "$RAW_JSON" ]; then
    source .env
    INPUT_TOKENS=$(jq -r '.usage.input_tokens // 0' "$RAW_JSON" 2>/dev/null)
    OUTPUT_TOKENS=$(jq -r '.usage.output_tokens // 0' "$RAW_JSON" 2>/dev/null)
    CACHE_READ=$(jq -r '.usage.cache_read_input_tokens // 0' "$RAW_JSON" 2>/dev/null)
    CACHE_CREATE=$(jq -r '.usage.cache_creation_input_tokens // 0' "$RAW_JSON" 2>/dev/null)
    COST_USD=$(jq -r '.total_cost_usd // 0' "$RAW_JSON" 2>/dev/null)
    DURATION_MS=$(jq -r '.duration_ms // 0' "$RAW_JSON" 2>/dev/null)
    docker exec -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB psql -U "$BLOG_DB_USER" -d "$BLOG_DB_NAME" -c \
        "INSERT INTO round_usage (agent, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, cost_usd, duration_ms)
         VALUES ('laboratorio', ${INPUT_TOKENS:-0}, ${OUTPUT_TOKENS:-0}, ${CACHE_READ:-0}, ${CACHE_CREATE:-0}, ${COST_USD:-0}, ${DURATION_MS:-0})" \
        >> "$LOG_DIR/runs.log" 2>&1 \
        || echo "$(date -Iseconds) — aviso: falha ao registrar uso de tokens desta rodada (laboratorio)" >> "$LOG_DIR/runs.log"
fi
rm -f "$RAW_JSON"

FRONTEND_UP=$(docker ps --filter "name=^DK_BLOG$" --filter "status=running" -q)
ALL_UP=""
if [ -n "$FRONTEND_UP" ]; then
    ALL_UP="1"
fi

/home/blog-bot/blog/notify-laboratorio.sh "$CLAUDE_EXIT" "$ALL_UP" "$LOG_FILE"
