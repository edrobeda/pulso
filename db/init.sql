-- Bootstrap schema do Pulso. Rodado automaticamente pelo Postgres só na
-- primeira subida do container (volume vazio), via docker-entrypoint-initdb.d.
-- Evoluções depois disso devem virar arquivos numerados em db/migrations/,
-- aplicados por db/run-migrations.sh — nunca edite este arquivo depois do
-- primeiro boot em produção.

CREATE TABLE IF NOT EXISTS backlog_entries (
  id SERIAL PRIMARY KEY,
  entry_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('shipped', 'analyzing', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backlog_entries_date_idx ON backlog_entries (entry_date DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
