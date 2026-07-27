#!/bin/bash
# Lê o resultado da rodada de infra-agent.sh e avisa o Edson via WhatsApp
# só quando algo foi entregue, algo falhou, ou o agente precisa de algo
# (registrado em NECESSIDADES.md). Silencioso em dias de "analyzing" puro.
# Separado do infra-agent.sh só por organização — mesmo mecanismo já usado
# pelo notify.sh do agente de publicação (Evolution API).
set -uo pipefail

CLAUDE_EXIT="$1"
ALL_UP="$2"
LOG_FILE="$3"
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

if [ "$CLAUDE_EXIT" -ne 0 ] || [ -z "$ALL_UP" ]; then
    send_whatsapp "⚠️ Diretor de infra do Pulso (18h) falhou (exit $CLAUDE_EXIT, containers ok: $([ -n "$ALL_UP" ] && echo sim || echo não)).

Últimas linhas do log:
$(tail -c 500 "$LOG_FILE")"
    exit 0
fi

if [ ! -f .last-infra-run.json ]; then
    send_whatsapp "⚠️ Diretor de infra do Pulso (18h) terminou sem gerar .last-infra-run.json — pode ter saído do escopo esperado. Confira o log:
$LOG_FILE"
    exit 0
fi

SHIPPED=$(python3 -c "import json; print(json.load(open('.last-infra-run.json')).get('shipped', False))" 2>/dev/null)
SUMMARY=$(python3 -c "import json; print(json.load(open('.last-infra-run.json')).get('summary',''))" 2>/dev/null)
NEEDS_INPUT=$(python3 -c "import json; print(json.load(open('.last-infra-run.json')).get('needs_input', False))" 2>/dev/null)

if [ "$SHIPPED" = "True" ]; then
    send_whatsapp "🛠️ Pulso — melhoria de infra entregue às 18h: ${SUMMARY}

https://blog.eventifylab.com/bastidores"
elif [ "$NEEDS_INPUT" = "True" ]; then
    send_whatsapp "🟡 Diretor de infra do Pulso precisa de algo seu — confira e responda diretamente em NECESSIDADES.md:
/home/blog-bot/blog/NECESSIDADES.md

Resumo da rodada: ${SUMMARY}"
else
    echo "$(date -Iseconds) — infra 18h não entregou (analyzing): ${SUMMARY}" >> "$LOG_DIR/runs.log"
fi
