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

# Registra o resultado em backup_log pra ficar visível em /bastidores (best-
# effort: um insert que falhar não deve mascarar o resultado real do backup
# nem travar o script, já que quem chama espera só o exit code do dump).
# $4 (restore_verified) é opcional: NULL nas falhas de geração do dump, onde
# testar restore não se aplica.
log_result() {
  local restore_verified="${4:-NULL}"
  docker exec -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
    psql -U "$BLOG_DB_USER" -d "$BLOG_DB_NAME" -v ON_ERROR_STOP=1 -c \
    "INSERT INTO backup_log (status, size_bytes, message, restore_verified) VALUES ('$1', ${2:-NULL}, $3, $restore_verified)" \
    >/dev/null 2>&1 || true
}

if ! docker exec -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
    pg_dump -U "$BLOG_DB_USER" -d "$BLOG_DB_NAME" --no-owner --no-privileges \
    | gzip > "$OUT"; then
  echo "backup falhou" >&2
  rm -f "$OUT"
  log_result 'failure' '' "'pg_dump ou gzip falhou'"
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
  log_result 'failure' '' "'arquivo .gz corrompido (falhou gzip -t)'"
  exit 1
fi
SIZE=$(stat -c%s "$OUT" 2>/dev/null || echo 0)
if [ "$SIZE" -lt "$MIN_BYTES" ]; then
  echo "backup suspeito: só $SIZE bytes (esperado bem mais que $MIN_BYTES)" >&2
  rm -f "$OUT"
  log_result 'failure' "$SIZE" "'dump menor que o piso esperado de $MIN_BYTES bytes'"
  exit 1
fi

# Retenção: mantém só os 14 backups mais recentes (~2 semanas de rodadas diárias).
ls -1t "$BACKUP_DIR"/backlog_*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm --

# gzip -t só prova que o arquivo não está truncado/corrompido — não prova
# que o SQL lá dentro restaura de fato (esquema incompleto, dump parcial
# que ainda assim descomprime limpo, etc.). Restaura pra um banco
# descartável dentro do mesmo container e compara a contagem de `posts`
# com a do banco vivo antes de considerar o backup restaurável de verdade.
RESTORE_DB="pulso_restore_test"
LIVE_COUNT=$(docker exec -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
  psql -U "$BLOG_DB_USER" -d "$BLOG_DB_NAME" -tAc "SELECT count(*) FROM posts" 2>/dev/null || echo -1)

docker exec -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
  psql -U "$BLOG_DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
  "DROP DATABASE IF EXISTS $RESTORE_DB" >/dev/null 2>&1
docker exec -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
  psql -U "$BLOG_DB_USER" -d postgres -v ON_ERROR_STOP=1 -c \
  "CREATE DATABASE $RESTORE_DB" >/dev/null 2>&1

RESTORE_OK=0
RESTORE_COUNT=-1
if gunzip -c "$OUT" | docker exec -i -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
    psql -U "$BLOG_DB_USER" -d "$RESTORE_DB" -v ON_ERROR_STOP=1 -q >/dev/null 2>&1; then
  RESTORE_COUNT=$(docker exec -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
    psql -U "$BLOG_DB_USER" -d "$RESTORE_DB" -tAc "SELECT count(*) FROM posts" 2>/dev/null || echo -1)
  if [ "$LIVE_COUNT" != "-1" ] && [ "$RESTORE_COUNT" = "$LIVE_COUNT" ]; then
    RESTORE_OK=1
  fi
fi

# Sempre limpa o banco descartável, com sucesso ou não no teste acima.
docker exec -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
  psql -U "$BLOG_DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $RESTORE_DB" >/dev/null 2>&1

if [ "$RESTORE_OK" = "1" ]; then
  log_result 'success' "$SIZE" "'restaurado e verificado: $RESTORE_COUNT posts'" true
  echo "backup criado e restore verificado: $OUT ($(du -h "$OUT" | cut -f1), $RESTORE_COUNT posts)"
else
  log_result 'success' "$SIZE" "'dump ok, mas teste de restore falhou ou contagem não bateu (viva=$LIVE_COUNT, restaurada=$RESTORE_COUNT)'" false
  echo "backup criado, mas teste de restore falhou: $OUT ($(du -h "$OUT" | cut -f1))" >&2
fi
