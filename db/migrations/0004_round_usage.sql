-- Transparência de custo/trabalho real por rodada de agente (pedido do
-- Edson via NECESSIDADES.md, 2026-08-01). Cada linha é uma rodada de um
-- dos agentes autônomos do Pulso (infra ou publicação), não referencia
-- posts nem backlog.
CREATE TABLE IF NOT EXISTS round_usage (
  id SERIAL PRIMARY KEY,
  agent TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  input_tokens BIGINT NOT NULL DEFAULT 0,
  output_tokens BIGINT NOT NULL DEFAULT 0,
  cache_read_tokens BIGINT NOT NULL DEFAULT 0,
  cache_creation_tokens BIGINT NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10, 4) NOT NULL DEFAULT 0,
  duration_ms BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS round_usage_run_at_idx ON round_usage (run_at DESC);
