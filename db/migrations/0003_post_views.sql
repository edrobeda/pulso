-- Contador de visualização por post. Tabela própria do agente de infra,
-- referenciando posts por slug (chave primária de `posts`) sem alterar
-- nenhuma coluna de conteúdo — engajamento é front do agente de infra,
-- não do agente de publicação.
CREATE TABLE IF NOT EXISTS post_views (
  slug TEXT PRIMARY KEY,
  view_count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
