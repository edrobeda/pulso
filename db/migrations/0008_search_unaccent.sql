-- Habilita busca insensível a acento no Postgres (usada por GET /api/search
-- em api/server.js), pra manter a busca funcionando sem trazer o corpo de
-- todo post pro cliente em toda visita (ver /api/posts, que agora só devolve
-- metadado).
CREATE EXTENSION IF NOT EXISTS unaccent;
