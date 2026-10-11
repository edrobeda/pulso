-- INP (Interaction to Next Paint) substituiu FID como Core Web Vital
-- oficial em 2024 e mede a latência de interação (clique/tap/tecla) até o
-- próximo paint — nenhuma das quatro métricas já coletadas (TTFB/FCP/LCP/
-- CLS) cobre isso. Mesmo padrão das demais: coletado em src/lib/vitals.js,
-- um valor por sessão (o pior registrado), via POST /api/vitals.
ALTER TABLE web_vitals DROP CONSTRAINT web_vitals_metric_check;
ALTER TABLE web_vitals ADD CONSTRAINT web_vitals_metric_check
  CHECK (metric IN ('ttfb', 'fcp', 'lcp', 'cls', 'inp'));
