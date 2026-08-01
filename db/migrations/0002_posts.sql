-- Tabela de posts. Antes disso os posts viviam como arquivos de dados em
-- src/content/posts/*.js (arquitetura "sem backend" original). Migrado pra
-- banco a pedido do Edson em 2026-08-01, pra permitir features futuras
-- (tags/comentários/busca) sem editar arquivo de conteúdo publicado.
CREATE TABLE IF NOT EXISTS posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  date DATE NOT NULL,
  slot TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  read_time INTEGER NOT NULL,
  blocks JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_date_slot_idx ON posts (date DESC, slot DESC);
