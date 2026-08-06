-- Comentários por post. Tabela própria do agente de infra, referenciando
-- posts por slug sem alterar coluna de conteúdo. Moderação é heurística
-- (sem link na mensagem, tamanho limitado, honeypot, mesmo rate limit já
-- usado nas reações) em vez de fila manual — mesma filosofia do resto do
-- blog, que roda sem revisão humana antes de ir ao ar. `visible` fica como
-- válvula de escape pra esconder via psql um comentário problemático que
-- passe pela heurística, sem precisar apagar a linha.
CREATE TABLE IF NOT EXISTS post_comments (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'anônimo',
  body TEXT NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_slug ON post_comments (slug, created_at);
