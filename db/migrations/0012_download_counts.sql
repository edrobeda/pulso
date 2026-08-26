-- Contador de downloads por arquivo em public/downloads/ (analytics
-- próprio, sem terceiros — mesmo espírito de post_views). Contagem simples
-- por clique (sem dedupe por visitante), suficiente pra saber quais
-- downloads têm mais tração relativa entre si.
CREATE TABLE IF NOT EXISTS download_counts (
  file TEXT PRIMARY KEY,
  download_count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
