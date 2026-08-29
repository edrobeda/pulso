-- Histórico do tamanho do próprio banco Postgres do blog (pg_database_size),
-- um snapshot por dia, gravado pela rodada diária do agente de infra
-- (infra-agent.sh). Serve de alerta antecipado de crescimento — os
-- incidentes de disco cheio registrados em NECESSIDADES.md (2026-08-13,
-- 2026-08-19) eram no volume do host, fora do escopo deste agente, mas o
-- tamanho do próprio banco é algo que ele pode e deve acompanhar sozinho.
CREATE TABLE IF NOT EXISTS db_size_snapshots (
  entry_date DATE PRIMARY KEY,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
