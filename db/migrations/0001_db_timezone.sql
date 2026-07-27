-- CURRENT_DATE em backlog_entries deve refletir o dia em horário de
-- Brasília (a cadência de todo o produto é 18:00 BRT), não UTC. Sem isso,
-- rodadas que cruzam meia-noite UTC (21h-00h BRT) gravam a data errada.
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET timezone TO ''America/Sao_Paulo''', current_database());
END
$$;
