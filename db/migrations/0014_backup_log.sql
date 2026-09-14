-- Histórico de execuções do backup diário do Postgres (db/backup.sh), pra
-- transparência pública em /bastidores: hoje o resultado do backup só é
-- visível olhando o disco por SSH, ninguém (nem o Edson, nem um visitante)
-- consegue confirmar de fora se a última rodada gravou um dump saudável.
CREATE TABLE IF NOT EXISTS backup_log (
  id SERIAL PRIMARY KEY,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
  size_bytes BIGINT,
  message TEXT
);

CREATE INDEX IF NOT EXISTS idx_backup_log_ran_at ON backup_log (ran_at DESC);
