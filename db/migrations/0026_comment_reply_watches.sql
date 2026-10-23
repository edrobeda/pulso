-- "Avisar quando responderem": leitor marca um comentário específico (só
-- os de primeiro nível, já que resposta-de-resposta é bloqueada na API) pra
-- receber um Web Push quando alguém responder, sem precisar voltar no post
-- pra descobrir — mesma infra de push_subscriptions já usada pra "novo
-- pulso no ar", só que o alvo aqui é um comentário, não todo o site.
-- UNIQUE evita duplicar aviso pro mesmo dispositivo marcando o mesmo
-- comentário mais de uma vez; CASCADE em ambas as pontas porque o aviso só
-- faz sentido enquanto o comentário e a inscrição existirem.
CREATE TABLE IF NOT EXISTS comment_reply_watches (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  subscription_id BIGINT NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, subscription_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reply_watches_comment ON comment_reply_watches (comment_id);
