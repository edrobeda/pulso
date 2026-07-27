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

rm -f .last-infra-run.json

CONTEXT="## Contexto desta rodada
Data de hoje (horário de Brasília): $DATE_BR
Esta é a rodada diária das 18:00 do agente de infraestrutura.

"
PROMPT="${CONTEXT}$(cat /home/blog-bot/blog/.infra-agent-prompt.md)"

/home/blog-bot/.local/bin/claude -p "$PROMPT" \
    --model claude-sonnet-5 \
    --effort high \
    --allow-dangerously-skip-permissions \
    --permission-mode bypassPermissions \
    > "$LOG_FILE" 2>&1
CLAUDE_EXIT=$?

echo "$(date -Iseconds) — rodada infra concluída (exit $CLAUDE_EXIT), log em $LOG_FILE" >> "$LOG_DIR/runs.log"

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
