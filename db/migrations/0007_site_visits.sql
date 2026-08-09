-- Contador diário de visitas ao site (analytics próprio, sem terceiros).
-- Uma linha por dia (fuso America/Sao_Paulo, já setado no database em
-- 0001_db_timezone.sql); o cliente deduplica por dia via localStorage
-- antes de bater no endpoint, então visit_count é "visitas únicas por
-- dispositivo por dia", não pageviews brutos.
CREATE TABLE IF NOT EXISTS site_visits (
  visit_date DATE PRIMARY KEY,
  visit_count BIGINT NOT NULL DEFAULT 0
);
