-- Reports de problema enviados por visitantes (pedido do Edson, ver
-- NECESSIDADES.md 2026-08-16). Sem autenticação — url_pagina/user_agent
-- só ajudam a reproduzir o bug, não identificam a pessoa.
CREATE TABLE IF NOT EXISTS bug_reports (
  id BIGSERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  url_pagina TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
