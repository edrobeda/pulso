-- "Excluir meu comentário": até agora não existia nenhum jeito de quem
-- comentou se retratar (typo, arrependimento, comentário de teste) sem
-- esperar moderação heurística ou pedir pra alguém apagar via psql. Guarda
-- o mesmo `clientToken` já gerado no navegador (localStorage, ver
-- src/lib/clientToken.js, mesmo padrão usado em comment_likes/comment_flags)
-- junto do comentário na hora da criação, pra provar autoria depois sem
-- precisar de conta/senha. NULL em comentários antigos (de antes desta
-- coluna existir) — esses simplesmente nunca terão o botão de excluir.
ALTER TABLE post_comments
  ADD COLUMN IF NOT EXISTS author_token TEXT;
