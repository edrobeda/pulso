-- Histórico de uso de disco do host (df de / e /mnt/storage-extra), um
-- snapshot por dia e por mount, gravado pela rodada diária do agente de
-- infra (infra-agent.sh). Nenhum dos dois agentes tem acesso de root a
-- /mnt/storage-extra/docker pra diagnosticar causa raiz de disco cheio
-- (ver NECESSIDADES.md, incidentes de 2026-08-13/19 e 2026-09-21), mas
-- ambos podem rodar `df` sem privilégio nenhum — isso dá visibilidade
-- histórica em /bastidores sem precisar reabrir o mesmo pedido toda vez
-- que o padrão se repetir.
CREATE TABLE IF NOT EXISTS disk_usage_snapshots (
  entry_date DATE NOT NULL,
  mount_path TEXT NOT NULL,
  total_bytes BIGINT NOT NULL,
  avail_bytes BIGINT NOT NULL,
  used_pct SMALLINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_date, mount_path)
);
