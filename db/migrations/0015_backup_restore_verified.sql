-- Teste de restore real do backup diário, não só integridade do .gz — ver
-- db/backup.sh: depois de gerar o dump, ele agora restaura pra um banco
-- descartável dentro do mesmo container e confere a contagem de `posts`
-- contra o banco vivo antes de reportar sucesso real de restore. NULL fica
-- pras linhas gravadas antes desta mudança (backup.sh ainda sem esse teste)
-- e pras linhas de falha na geração do dump, onde testar restore não faz
-- sentido.
ALTER TABLE backup_log ADD COLUMN IF NOT EXISTS restore_verified BOOLEAN;
