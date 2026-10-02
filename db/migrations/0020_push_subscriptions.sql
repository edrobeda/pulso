-- Inscrições de notificação push (Web Push API) pra avisar quando um post
-- novo sai, sem depender de o leitor abrir o site pra descobrir — pensado
-- pra quem lê no celular sem sempre ter as duas mãos livres pra checar.
-- `endpoint` já é globalmente único por natureza do protocolo (URL do push
-- service do navegador), então serve de chave natural pra upsert/delete.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
