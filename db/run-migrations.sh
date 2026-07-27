#!/bin/bash
# Aplica qualquer arquivo novo em db/migrations/*.sql que ainda não esteja
# registrado em schema_migrations, em ordem alfabética (prefixe com número:
# 0001_algo.sql, 0002_outra_coisa.sql). Idempotente — pode rodar toda vez.
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck disable=SC1091
source .env

for file in db/migrations/*.sql; do
  [ -e "$file" ] || continue
  version=$(basename "$file")
  applied=$(docker exec -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
    psql -U "$BLOG_DB_USER" -d "$BLOG_DB_NAME" -tAc \
    "SELECT 1 FROM schema_migrations WHERE version = '$version'")
  if [ "$applied" = "1" ]; then
    continue
  fi
  echo "Aplicando migration: $version"
  docker exec -i -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
    psql -U "$BLOG_DB_USER" -d "$BLOG_DB_NAME" < "$file"
  docker exec -e PGPASSWORD="$BLOG_DB_PASSWORD" DK_BLOG_DB \
    psql -U "$BLOG_DB_USER" -d "$BLOG_DB_NAME" -c \
    "INSERT INTO schema_migrations (version) VALUES ('$version')"
done
