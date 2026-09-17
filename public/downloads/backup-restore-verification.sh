#!/usr/bin/env bash
#
# ⚠️ AVISO LEGAL: este script é fornecido "como está", sem garantias de
# qualquer tipo, extraído e adaptado de um caso real para uso genérico.
# Não foi testado no seu ambiente. Leia, entenda e adapte antes de usar
# em produção. O autor não se responsabiliza por qualquer dano, perda de
# dados ou mau funcionamento decorrente do uso deste conteúdo.
#
# Template de verificação de RESTORE real de um backup Postgres já gerado
# (dump + gzip), pra rodar logo depois de criar o arquivo.
#
# Lição por trás: `gzip -t` só prova que o arquivo comprimido não está
# truncado — não prova que o SQL lá dentro restaura até o fim contra um
# banco de verdade (schema incompleto, dump parcial de uma tabela que
# falhou no meio sem derrubar o processo, etc. ainda passam no teste de
# integridade do arquivo). A única validação definitiva é restaurar de
# fato num destino descartável e comparar um sinal de saúde simples
# (contagem de linhas de uma tabela que varia de verdade) contra o banco
# vivo. Isso complementa a checagem de integridade de arquivo — não
# substitui: mantenha as duas.
#
# Uso: chame depois do seu script de dump normal, passando o caminho do
# .gz gerado. Ex.: ./backup-restore-verification.sh /caminho/backup.sql.gz

set -euo pipefail

DUMP_FILE="${1:?uso: $0 <caminho-do-backup.sql.gz>}"
DB_USER="seu_usuario"                # <-- ajuste
LIVE_DB="seu_banco"                  # <-- ajuste: banco vivo, de onde veio o dump
RESTORE_DB="restore_test_$$"         # banco descartável, nome único por execução
SIGNAL_TABLE="uma_tabela_que_varia"  # <-- ajuste: tabela com contagem que muda de verdade,
                                      #     não uma tabela de configuração estática

# Ajuste os três comandos abaixo pro seu ambiente real (psql local, remoto,
# ou dentro de um container via `docker exec -e PGPASSWORD=... nome_container ...`).
psql_live() { psql -U "$DB_USER" -d "$LIVE_DB" "$@"; }
psql_admin() { psql -U "$DB_USER" -d postgres "$@"; }
psql_restore() { psql -U "$DB_USER" -d "$RESTORE_DB" "$@"; }

cleanup() {
  psql_admin -v ON_ERROR_STOP=0 -c "DROP DATABASE IF EXISTS $RESTORE_DB" >/dev/null 2>&1 || true
}
trap cleanup EXIT

LIVE_COUNT=$(psql_live -tAc "SELECT count(*) FROM $SIGNAL_TABLE" 2>/dev/null || echo -1)

psql_admin -v ON_ERROR_STOP=1 -c "CREATE DATABASE $RESTORE_DB" >/dev/null

RESTORE_OK=0
RESTORE_COUNT=-1
if gunzip -c "$DUMP_FILE" | psql_restore -v ON_ERROR_STOP=1 -q >/dev/null 2>&1; then
  RESTORE_COUNT=$(psql_restore -tAc "SELECT count(*) FROM $SIGNAL_TABLE" 2>/dev/null || echo -1)
  if [ "$LIVE_COUNT" != "-1" ] && [ "$RESTORE_COUNT" = "$LIVE_COUNT" ]; then
    RESTORE_OK=1
  fi
fi

# `cleanup` (via trap) roda automaticamente ao sair, com sucesso ou falha.

if [ "$RESTORE_OK" = "1" ]; then
  echo "restore verificado com sucesso: $RESTORE_COUNT registros (igual ao banco vivo)"
  exit 0
else
  echo "restore falhou ou contagem não bateu (vivo=$LIVE_COUNT, restaurado=$RESTORE_COUNT)" >&2
  # substitua pela sua notificação real e/ou grave o resultado num
  # histórico visível (ver lição "verificacao-que-so-o-processo-ve" —
  # um teste que só um log local vê equivale a não ter teste)
  exit 1
fi
