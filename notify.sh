#!/bin/bash
# Lê o resultado da rodada de publish-agent.sh e avisa o Edson via WhatsApp:
# sucesso (novo post) ou falha. Separado do script principal só por
# organização — mesmo mecanismo já usado pelo devtools (Evolution API).
set -uo pipefail

CLAUDE_EXIT="$1"
CONTAINER_UP="$2"
SLOT="$3"
LOG_FILE="$4"
LOG_DIR="/home/blog-bot/blog/.agent-logs"

cd /home/blog-bot/blog || exit 1

# shellcheck disable=SC1091
source /home/blog-bot/.notify-secrets
INSTANCE_URL_ENC="${EVOLUTION_INSTANCE//+/%2B}"

send_whatsapp() {
    local texto="$1"
    export EVOLUTION_NUMBER
    export TEXTO="$texto"
    local body
    body=$(python3 -c "
import json, os
print(json.dumps({'number': os.environ['EVOLUTION_NUMBER'], 'text': os.environ['TEXTO']}))
")
    curl -s -X POST "https://evo.eventifylab.com/message/sendText/$INSTANCE_URL_ENC" \
        -H "apikey: $EVOLUTION_API_KEY" \
        -H "Content-Type: application/json" \
        -d "$body" > /dev/null
}

if [ "$CLAUDE_EXIT" -ne 0 ] || [ -z "$CONTAINER_UP" ]; then
    send_whatsapp "⚠️ Pulso das $SLOT falhou (exit $CLAUDE_EXIT, container up: $([ -n "$CONTAINER_UP" ] && echo sim || echo não)).

Últimas linhas do log:
$(tail -c 500 "$LOG_FILE")"
    exit 0
fi

if [ -f .last-run.json ]; then
    PUBLISHED=$(python3 -c "import json; print(json.load(open('.last-run.json')).get('published', False))" 2>/dev/null)
    if [ "$PUBLISHED" = "True" ]; then
        TITLE=$(python3 -c "import json; print(json.load(open('.last-run.json')).get('title',''))" 2>/dev/null)
        SLUG=$(python3 -c "import json; print(json.load(open('.last-run.json')).get('slug',''))" 2>/dev/null)
        send_whatsapp "🟢 Novo pulso (${SLOT}): ${TITLE}

https://blog.eventifylab.com/posts/${SLUG}"
    else
        REASON=$(python3 -c "import json; print(json.load(open('.last-run.json')).get('reason',''))" 2>/dev/null)
        echo "$(date -Iseconds) — pulso $SLOT não publicou: $REASON" >> "$LOG_DIR/runs.log"
    fi
else
    send_whatsapp "⚠️ Pulso das $SLOT terminou sem gerar .last-run.json — o agente pode ter saído do escopo esperado. Confira o log:
$LOG_FILE"
fi
