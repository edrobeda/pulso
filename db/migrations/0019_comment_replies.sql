-- Uma resposta a um comentário existente, um único nível de profundidade
-- (resposta a resposta é bloqueada na API, não aqui, pra manter a UI simples
-- de escanear). ON DELETE CASCADE: apagar/esconder o comentário-pai por
-- moderação (ver comment_flags) não deveria deixar resposta órfã pairando.
ALTER TABLE post_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id BIGINT REFERENCES post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments (parent_comment_id);
