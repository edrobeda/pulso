-- ⚠️ AVISO LEGAL: este script é fornecido "como está", sem garantias de
-- qualquer tipo, extraído e adaptado de um caso real para uso genérico.
-- Não foi testado no seu ambiente. Leia, entenda e adapte antes de usar
-- em produção. O autor não se responsabiliza por qualquer dano, perda de
-- dados ou mau funcionamento decorrente do uso deste conteúdo.
--
-- Template: índice GIN trigram (pg_trgm) sobre busca ILIKE '%termo%' com
-- normalização de acento — e os três detalhes que travam a criação do
-- índice se forem ignorados.
--
-- Contexto: `WHERE unaccent(coluna) ILIKE '%' || unaccent($1) || '%'` sem
-- índice é Seq Scan completo a cada busca, e piora conforme a tabela
-- cresce. pg_trgm permite que um índice GIN acelere justamente esse
-- padrão — mas só se a expressão do índice bater com a expressão da
-- query, e só se toda função usada nessa expressão for IMMUTABLE.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Pegadinha 1: unaccent() é marcada STABLE no catálogo do Postgres (o
-- resultado depende do dicionário resolvido via search_path em tempo de
-- execução), não IMMUTABLE — o Postgres recusa usá-la direto numa
-- expressão de índice. O wrapper abaixo fixa o dicionário explicitamente,
-- o que torna o resultado determinístico pro mesmo input e permite
-- declarar IMMUTABLE com segurança.
--
-- Pegadinha 2: se este wrapper fosse `LANGUAGE sql`, o planner pode
-- "inlinear" o corpo dentro da expressão do índice, recompondo a chamada
-- num contexto que não resolve mais a função original (mesmo ela
-- existindo) — `plpgsql` nunca sofre esse inlining.
--
-- Pegadinha 3: `CREATE INDEX` executa a função com search_path restrito
-- (hardening padrão do Postgres contra search_path hijacking) — uma
-- chamada não qualificada a `unaccent(...)` dentro do wrapper falha por
-- esse motivo, mesmo a extensão estando instalada. Use o nome totalmente
-- qualificado (`public.unaccent`, ajuste o schema se a extensão estiver
-- em outro).
CREATE OR REPLACE FUNCTION immutable_unaccent(text) RETURNS text AS $$
BEGIN
  RETURN public.unaccent('public.unaccent'::regdictionary, $1);
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE STRICT;

-- Mesma restrição vale pra qualquer outra função "normalizadora" composta
-- na expressão — array_to_string(text[], text), por exemplo, também é
-- STABLE no catálogo (não IMMUTABLE) mesmo sendo, na prática, determinístico
-- pro seu caso de uso. Generalize o mesmo padrão de wrapper quando precisar.
CREATE OR REPLACE FUNCTION immutable_array_to_string(text[], text) RETURNS text AS $$
BEGIN
  RETURN array_to_string($1, $2);
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE STRICT;

-- Índice funcional: a expressão aqui precisa ser EXATAMENTE a mesma usada
-- no WHERE da sua query (mesma função, mesmos argumentos), senão o
-- planner não reconhece o índice como aplicável e volta pro Seq Scan sem
-- erro nenhum — silenciosamente ignorado, não uma falha visível.
CREATE INDEX IF NOT EXISTS sua_tabela_sua_coluna_trgm_idx
  ON sua_tabela USING gin (immutable_unaccent(sua_coluna) gin_trgm_ops);

-- Confirme o ganho real, não assuma pelo "rodou sem erro": o plano
-- precisa trocar Seq Scan por Bitmap Index Scan / Index Scan.
-- EXPLAIN (ANALYZE, BUFFERS)
-- SELECT * FROM sua_tabela
-- WHERE immutable_unaccent(sua_coluna) ILIKE '%' || immutable_unaccent('termo de busca') || '%';
