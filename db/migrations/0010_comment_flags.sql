-- Sinalização de comentário como spam/problema pelo leitor. Sem
-- autenticação (mesma filosofia do resto do blog), então a defesa contra
-- abuso é: 1 flag por comentário por navegador (dedupe client-side via
-- localStorage, mesmo padrão já usado nas reações) + limite de flags únicos
-- antes de auto-esconder. UNIQUE(comment_id, client_token) impede um mesmo
-- cliente inflar a contagem só repetindo o POST.
CREATE TABLE IF NOT EXISTS comment_flags (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  client_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, client_token)
);

CREATE INDEX IF NOT EXISTS idx_comment_flags_comment ON comment_flags (comment_id);
