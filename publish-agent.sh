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

/home/blog-bot/.local/bin/claude -p "$PROMPT" \
    --model claude-sonnet-5 \
    --effort high \
    --allow-dangerously-skip-permissions \
    --permission-mode bypassPermissions \
    > "$LOG_FILE" 2>&1
CLAUDE_EXIT=$?

echo "$(date -Iseconds) — rodada $SLOT concluída (exit $CLAUDE_EXIT), log em $LOG_FILE" >> "$LOG_DIR/runs.log"

CONTAINER_UP=$(docker ps --filter "name=DK_BLOG" --filter "status=running" -q)

# NOTIFICAÇÃO: ver notify.sh (chamado a partir daqui, mantido em arquivo
# separado por conter o envio via WhatsApp).
/home/blog-bot/blog/notify.sh "$CLAUDE_EXIT" "$CONTAINER_UP" "$SLOT" "$LOG_FILE"
