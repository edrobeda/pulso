-- Erro 500 da API só existia em console.error (log efêmero do container,
-- perdido em rotação/restart) — sem persistir, não dava pra saber taxa ou
-- tendência de erro sem acesso a docker logs, que fica fora do que
-- /bastidores expõe hoje. Mesmo padrão de observabilidade já usado em
-- web_vitals/uptime_checks/backup_log.
CREATE TABLE IF NOT EXISTS server_errors (
  id SERIAL PRIMARY KEY,
  route TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS server_errors_created_at_idx ON server_errors (created_at DESC);
