-- GET /api/search (api/server.js) faz ILIKE '%termo%' sem acento em 4
-- colunas de `posts`, incluindo o corpo inteiro em JSON (`blocks::text`),
-- sem nenhum índice — hoje é Seq Scan na tabela inteira a cada busca (ver
-- comentário acima de `searchLimiter` em api/server.js). Com 150 posts e
-- crescendo 2/dia isso só piora. pg_trgm permite que um índice GIN acelere
-- justamente esse padrão (ILIKE '%...%'), mas só se a expressão do WHERE
-- bater com a do índice — e unaccent() é marcada STABLE (depende de
-- search_path), não IMMUTABLE, então o Postgres recusa indexar
-- unaccent(coluna) direto. O wrapper abaixo fixa o dicionário
-- explicitamente ('unaccent'), o que torna o resultado determinístico pro
-- mesmo input, permitindo marcá-lo IMMUTABLE.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Duas pegadinhas do Postgres aqui, não só uma:
-- 1) LANGUAGE sql sofre "inlining" dentro da expressão do índice, que
--    re-resolve o corpo num contexto que não encontra unaccent() mesmo ele
--    existindo — plpgsql nunca inlineia, então evita isso.
-- 2) CREATE INDEX executa a função com search_path restrito (vazio/
--    pg_catalog, hardening contra search_path hijacking), então uma
--    chamada não qualificada a `unaccent(...)` falha mesmo dentro de
--    plpgsql — precisa do nome completo `public.unaccent(...)`.
CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text AS $$
BEGIN
  RETURN public.unaccent('public.unaccent'::regdictionary, $1);
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE STRICT;

-- array_to_string(text[], text) é STABLE no catálogo do Postgres (não
-- IMMUTABLE), então não pode compor direto dentro da expressão do índice
-- abaixo — mesmo join sendo, na prática, determinístico pro nosso caso.
CREATE OR REPLACE FUNCTION immutable_tags_text(text[]) RETURNS text AS $$
BEGIN
  RETURN array_to_string($1, ' ');
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE STRICT;

CREATE INDEX IF NOT EXISTS posts_title_trgm_idx
  ON posts USING gin (immutable_unaccent(title) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS posts_excerpt_trgm_idx
  ON posts USING gin (immutable_unaccent(excerpt) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS posts_tags_trgm_idx
  ON posts USING gin (immutable_unaccent(immutable_tags_text(tags)) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS posts_blocks_trgm_idx
  ON posts USING gin (immutable_unaccent(blocks::text) gin_trgm_ops);
