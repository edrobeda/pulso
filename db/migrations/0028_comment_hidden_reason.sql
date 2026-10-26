-- Hoje `visible = false` serve pra dois casos bem diferentes (autor
-- excluindo o próprio comentário via DELETE, e auto-hide por flag da
-- comunidade atingindo FLAG_HIDE_THRESHOLD) sem distinção nenhuma — não dá
-- pra saber, nem no banco nem em /bastidores, quando a moderação coletiva
-- de fato agiu. Essa coluna separa os dois motivos. NULL em linhas antigas
-- que já estavam invisible antes desta migration (não sabemos retroativamente
-- qual dos dois foi).
ALTER TABLE post_comments
  ADD COLUMN IF NOT EXISTS hidden_reason TEXT
  CHECK (hidden_reason IS NULL OR hidden_reason IN ('flagged', 'self_deleted'));
