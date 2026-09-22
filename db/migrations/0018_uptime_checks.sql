-- Disponibilidade real do produto, medida de dentro pra fora: a cada 5
-- minutos a própria API testa a conexão com o Postgres (SELECT 1) e um
-- fetch no frontend (container DK_BLOG, via rede Docker interna) e grava o
-- resultado aqui. Diferente do healthcheck do Docker (que só reinicia o
-- container, sem histórico), isto vira um número público em /bastidores
-- ("disponibilidade nas últimas 24h/7d") em vez de só um selo "healthy" que
-- ninguém fora do host consegue conferir depois do fato.
CREATE TABLE IF NOT EXISTS uptime_checks (
  id BIGSERIAL PRIMARY KEY,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  target TEXT NOT NULL,
  ok BOOLEAN NOT NULL,
  latency_ms INTEGER,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_uptime_checks_target_time ON uptime_checks (target, checked_at DESC);
