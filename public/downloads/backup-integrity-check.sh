#!/usr/bin/env bash
#
# ⚠️ AVISO LEGAL: este script é fornecido "como está", sem garantias de
# qualquer tipo, extraído e adaptado de um caso real para uso genérico.
# Não foi testado no seu ambiente. Leia, entenda e adapte antes de usar
# em produção. O autor não se responsabiliza por qualquer dano, perda de
# dados ou mau funcionamento decorrente do uso deste conteúdo.
#
# Template de backup com verificação de integridade real antes de aceitar
# o arquivo como válido.
#
# Lição por trás: um backup que "terminou com sucesso" (exit 0) não prova
# nada — disco cheio no meio da escrita, processo interrompido ou pipe
# corrompido podem deixar um .gz truncado com nome e data normais. Sem
# testar o arquivo depois de gerado, você só descobre que o backup é
# inútil no dia em que precisa restaurar de verdade.
#
# Uso: adapte as variáveis abaixo e chame pelo cron, ex.:
#   0 3 * * * /caminho/para/backup-integrity-check.sh >> /caminho/log.log 2>&1

set -euo pipefail

BACKUP_DIR="/caminho/para/backups"          # <-- ajuste
DB_NAME="seu_banco"                          # <-- ajuste
DB_USER="seu_usuario"                        # <-- ajuste
MIN_SIZE_BYTES=1024                          # <-- ajuste pro tamanho mínimo plausível do seu dump
TIMESTAMP="$(date -u +%Y%m%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "$(date -u +%FT%TZ) gerando backup em $OUT_FILE"

# Ajuste pro seu comando real de dump (pg_dump, mysqldump, etc.)
pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$OUT_FILE"

# --- A parte que costuma faltar: validar o arquivo gerado ---

fail() {
  echo "$(date -u +%FT%TZ) backup inválido: $1 — removendo $OUT_FILE"
  rm -f "$OUT_FILE"
  # substitua pela sua notificação real (webhook, e-mail, etc.)
  # notify.sh "backup falhou: $1"
  exit 1
}

if [ ! -s "$OUT_FILE" ]; then
  fail "arquivo vazio ou não gerado"
fi

ACTUAL_SIZE=$(stat -c%s "$OUT_FILE" 2>/dev/null || stat -f%z "$OUT_FILE")
if [ "$ACTUAL_SIZE" -lt "$MIN_SIZE_BYTES" ]; then
  fail "tamanho ($ACTUAL_SIZE bytes) abaixo do piso mínimo ($MIN_SIZE_BYTES bytes)"
fi

if ! gzip -t "$OUT_FILE" 2>/dev/null; then
  fail "teste de integridade gzip falhou (arquivo truncado/corrompido)"
fi

echo "$(date -u +%FT%TZ) backup validado com sucesso ($ACTUAL_SIZE bytes): $OUT_FILE"
exit 0
