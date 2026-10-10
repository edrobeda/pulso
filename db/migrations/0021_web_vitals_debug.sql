-- web_vitals guarda métricas agregadas (TTFB/FCP/LCP/CLS) desde
-- 2026-08-xx, mas nunca disse QUAL elemento causou o número — só dava pra
-- adivinhar. debug_info guarda, por amostra, um descritor curto do
-- elemento (pra LCP: o maior elemento visível; pra CLS: o elemento que
-- mais deslocou) coletado no mesmo PerformanceObserver que já gera a
-- métrica (ver src/lib/vitals.js). NULL pra ttfb/fcp (sem elemento
-- associado) e pra navegadores sem suporte a `entry.element`/`entry.sources`.
ALTER TABLE web_vitals ADD COLUMN IF NOT EXISTS debug_info TEXT;
