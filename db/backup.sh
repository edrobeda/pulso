#!/bin/bash
# Backup diário do Postgres do Pulso (dump lógico via pg_dump, comprimido).
# Chamado automaticamente por infra-agent.sh antes de cada rodada; também
# pode ser rodado manualmente. Best-effort: quem chama não deve travar a
# rodada inteira se isso falhar.
set -uo pipefail

cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
source .env

BACKUP_DIR="db/backups"
mkdir -p "$BACKUP_DIR"

STAMP=$(date +%Y%m%d_%H%M%S)
OUT="$BACKUP_DIR/backlog_${STAMP}.sql.gz"

if ! docker exec -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
    pg_dump -U "$BLOG_DB_USER" -d "$BLOG_DB_NAME" --no-owner --no-privileges \
    | gzip > "$OUT"; then
  echo "backup falhou" >&2
  rm -f "$OUT"
  exit 1
fi

# Verificação de integridade: exit code 0 na pipeline acima não garante que o
# .gz é utilizável — um disco cheio no meio da escrita (risco real agora, ver
# NECESSIDADES.md 2026-08-19) pode truncar o arquivo sem que gzip/pg_dump
# retornem erro. `gzip -t` decodifica o stream inteiro e falha se estiver
# corrompido; o piso de tamanho pega o caso de um dump vazio/quase vazio que
# passaria no teste de integridade mas não seria um backup de verdade.
MIN_BYTES=1024
if ! gzip -t "$OUT" 2>/dev/null; then
  echo "backup corrompido: falha na verificação de integridade (gzip -t)" >&2
  rm -f "$OUT"
  exit 1
fi
SIZE=$(stat -c%s "$OUT" 2>/dev/null || echo 0)
if [ "$SIZE" -lt "$MIN_BYTES" ]; then
  echo "backup suspeito: só $SIZE bytes (esperado bem mais que $MIN_BYTES)" >&2
  rm -f "$OUT"
  exit 1
fi

# Retenção: mantém só os 14 backups mais recentes (~2 semanas de rodadas diárias).
ls -1t "$BACKUP_DIR"/backlog_*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm --

echo "backup criado: $OUT ($(du -h "$OUT" | cut -f1))"
