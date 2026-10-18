-- Contagem de "útil" por comentário. Mesmo padrão de dedupe por
-- client_token já usado em comment_flags (UNIQUE impede o mesmo navegador
-- inflar a contagem clicando várias vezes), mas sem limiar de auto-ação:
-- isso é só um sinal positivo pra destacar comentários bons, nunca esconde
-- nada (quem quer esconder, sinaliza — tabela separada, comment_flags).
CREATE TABLE IF NOT EXISTS comment_likes (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  client_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, client_token)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes (comment_id);
