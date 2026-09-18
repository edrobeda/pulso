-- Real User Monitoring (RUM) próprio, sem serviço de terceiro: guarda as
-- métricas de performance que o navegador de cada visitante já mede
-- nativamente (TTFB, FCP, LCP, CLS), coletadas em src/lib/vitals.js e
-- enviadas uma vez por sessão via POST /api/vitals.
CREATE TABLE IF NOT EXISTS web_vitals (
  id SERIAL PRIMARY KEY,
  metric TEXT NOT NULL CHECK (metric IN ('ttfb', 'fcp', 'lcp', 'cls')),
  value DOUBLE PRECISION NOT NULL,
  path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_web_vitals_metric_created_at
  ON web_vitals (metric, created_at DESC);
