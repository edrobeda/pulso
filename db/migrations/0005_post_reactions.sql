-- Reações rápidas por post (emoji fixo, sem texto livre — evita risco de
-- spam/moderação que comentário abriria). Tabela própria do agente de
-- infra, referenciando posts por slug sem alterar coluna de conteúdo.
CREATE TABLE IF NOT EXISTS post_reactions (
  slug TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (slug, emoji)
);
