-- Log de buscas feitas em GET /api/search, pra entender o que os leitores
-- procuram (inclusive buscas sem resultado, que apontam lacuna de conteúdo).
-- `query` guarda o texto normalizado (minúsculo, aparado); texto livre
-- digitado por visitante pode conter algo pessoal, então a API nunca expõe
-- termo isolado publicamente — só agregados de termos repetidos (ver
-- GET /api/search/top-queries em api/server.js).
CREATE TABLE IF NOT EXISTS search_queries (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_query ON search_queries (query);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries (created_at);
