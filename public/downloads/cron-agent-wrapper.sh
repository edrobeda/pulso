#!/usr/bin/env bash
#
# ⚠️ AVISO LEGAL: este script é fornecido "como está", sem garantias de
# qualquer tipo, extraído e adaptado de um caso real para uso genérico.
# Não foi testado no seu ambiente. Leia, entenda e adapte antes de usar
# em produção. O autor não se responsabiliza por qualquer dano, perda de
# dados ou mau funcionamento decorrente do uso deste conteúdo.
#
# Template de wrapper para rodar um agente autônomo (ou qualquer job)
# via cron com frequência alta, sem risco de rodadas sobrepostas e sem
# travar o cron inteiro se uma rodada nunca terminar.
#
# Lição por trás: um job travado (ex.: uma chamada de API que nunca
# responde) sem timeout consome o slot inteiro até o próximo cron, e sem
# lock, o cron seguinte pode iniciar uma segunda instância em cima da
# primeira — gerando dois processos concorrentes editando o mesmo estado.
#
# Uso: adapte as variáveis abaixo e chame este script pelo cron, ex.:
#   */15 * * * * /caminho/para/cron-agent-wrapper.sh >> /caminho/log.log 2>&1

set -euo pipefail

PROJECT_DIR="/caminho/para/seu-projeto"      # <-- ajuste
LOCK_FILE="$PROJECT_DIR/.agent.lock"
TIMEOUT="45m"                                 # deve ser MENOR que o intervalo do cron
COMMAND="agente-cli --prompt-file .agent-prompt.md"  # <-- ajuste pro seu comando real

cd "$PROJECT_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "$(date -u +%FT%TZ) rodada anterior ainda em execução, pulando esta"
  exit 0
fi

echo "$(date -u +%FT%TZ) iniciando rodada"

set +e
timeout "$TIMEOUT" bash -c "$COMMAND"
EXIT_CODE=$?
set -e

if [ "$EXIT_CODE" -ne 0 ]; then
  echo "$(date -u +%FT%TZ) rodada terminou com erro (exit $EXIT_CODE)"
  # substitua pela sua notificação real (webhook, e-mail, etc.)
  # notify.sh "agente falhou com exit $EXIT_CODE"
else
  echo "$(date -u +%FT%TZ) rodada concluída com sucesso"
fi

exit "$EXIT_CODE"
