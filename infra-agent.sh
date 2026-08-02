#!/bin/bash
# Segundo agente do Pulso — "diretor de infra", disparado via cron do
# usuário blog-bot às 21:00 UTC (= 18:00 horário de Brasília). Só deve
# tocar em /home/blog-bot/blog (ver .infra-agent-prompt.md pro escopo
# completo). Separado do publish-agent.sh (08h/13h, cuida só do conteúdo).
set -uo pipefail

cd /home/blog-bot/blog || exit 1

LOG_DIR="/home/blog-bot/blog/.agent-logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/infra_$(date +%Y-%m-%d_%H-%M-%S).log"

# Backup diário do Postgres antes de qualquer mudança nesta rodada —
# best-effort, não deve travar a rodada se falhar (ver db/backup.sh).
./db/backup.sh >> "$LOG_DIR/runs.log" 2>&1 || echo "$(date -Iseconds) — aviso: backup do Postgres falhou nesta rodada" >> "$LOG_DIR/runs.log"

DATE_BR=$(TZ='America/Sao_Paulo' date +%F)
DOW=$(TZ='America/Sao_Paulo' date +%u)  # 1=segunda ... 7=domingo

rm -f .last-infra-run.json

SUPER_UPGRADE=""
if [ "$DOW" = "7" ]; then
    SUPER_UPGRADE="
Hoje é domingo — dia de \"super upgrade\": em vez do limite normal de UMA
melhoria, você pode entregar até CINCO melhorias concretas nesta rodada
(dia mais tranquilo, cota maior disponível). Ver regra completa na seção
\"O que fazer nesta rodada\" abaixo.
"
fi

CONTEXT="## Contexto desta rodada
Data de hoje (horário de Brasília): $DATE_BR
Esta é a rodada diária das 18:00 do agente de infraestrutura.
${SUPER_UPGRADE}
"
PROMPT="${CONTEXT}$(cat /home/blog-bot/blog/.infra-agent-prompt.md)"

RAW_JSON="$LOG_DIR/.infra-raw-$(date +%Y-%m-%d_%H-%M-%S).json"

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
# registrar custo real da rodada (pedido do Edson, ver NECESSIDADES.md
# 2026-08-01).
jq -r '.result // "(sem resultado — ver exit code '"$CLAUDE_EXIT"')"' "$RAW_JSON" >> "$LOG_FILE" 2>/dev/null

echo "$(date -Iseconds) — rodada infra concluída (exit $CLAUDE_EXIT), log em $LOG_FILE" >> "$LOG_DIR/runs.log"

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
         VALUES ('infra', ${INPUT_TOKENS:-0}, ${OUTPUT_TOKENS:-0}, ${CACHE_READ:-0}, ${CACHE_CREATE:-0}, ${COST_USD:-0}, ${DURATION_MS:-0})" \
        >> "$LOG_DIR/runs.log" 2>&1 \
        || echo "$(date -Iseconds) — aviso: falha ao registrar uso de tokens desta rodada" >> "$LOG_DIR/runs.log"
fi
rm -f "$RAW_JSON"

FRONTEND_UP=$(docker ps --filter "name=^DK_BLOG$" --filter "status=running" -q)
DB_UP=$(docker ps --filter "name=^DK_BLOG_DB$" --filter "status=running" -q)
API_UP=$(docker ps --filter "name=^DK_BLOG_API$" --filter "status=running" -q)
ALL_UP=""
if [ -n "$FRONTEND_UP" ] && [ -n "$DB_UP" ] && [ -n "$API_UP" ]; then
    ALL_UP="1"
fi

# NOTIFICAÇÃO: ver notify-infra.sh (mantido em arquivo separado por conter
# o envio via WhatsApp, mesmo padrão do notify.sh do agente de publicação).
/home/blog-bot/blog/notify-infra.sh "$CLAUDE_EXIT" "$ALL_UP" "$LOG_FILE"
