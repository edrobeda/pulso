#!/usr/bin/env bash
#
# ⚠️ AVISO LEGAL: este script é fornecido "como está", sem garantias de
# qualquer tipo, extraído e adaptado de um caso real para uso genérico.
# Não foi testado no seu ambiente. Leia, entenda e adapte antes de usar
# em produção. O autor não se responsabiliza por qualquer dano, perda de
# dados ou mau funcionamento decorrente do uso deste conteúdo.
#
# Template de rotação de log operacional em disco (sem versionar no git).
#
# Lição por trás: um processo agendado que grava um arquivo de log por
# execução (ex.: 3-4x por dia, todo dia) parece inofensivo isoladamente,
# mas se esses arquivos forem comitados no controle de versão sem nunca
# serem removidos, o histórico do repositório cresce pra sempre com dado
# puramente operacional (útil só nos últimos dias, pra debug) — e nada
# quebra, nada avisa, o repositório só fica progressivamente mais pesado
# até alguém notar centenas de arquivos acumulados. A correção tem duas
# partes independentes:
#   1. Log de execução (efêmero, só serve recente) fica em disco, fora
#      do git (.gitignore), com rotação automática.
#   2. Histórico que precisa durar (o que foi decidido, o que mudou)
#      vira uma entrada curta num changelog/registro versionado — um
#      resumo permanente, não o log bruto de cada rodada.
#
# Uso: chame no fim de cada rodada do seu processo agendado, ex. dentro
# do próprio wrapper que já roda a cada execução:
#   /caminho/para/log-operacional-rotacao-sem-git.sh /caminho/para/logs 60

set -euo pipefail

LOG_DIR="${1:-/caminho/para/.agent-logs}"   # <-- ajuste: pasta de logs de execução
MAX_AGE_DAYS="${2:-60}"                      # <-- ajuste: quantos dias manter em disco

if [ ! -d "$LOG_DIR" ]; then
  echo "Pasta de log não existe: $LOG_DIR" >&2
  exit 1
fi

# Remove só arquivos de log mais antigos que MAX_AGE_DAYS — nunca a pasta inteira,
# nunca sem o filtro de idade (evita apagar log de rodada em andamento ou recente).
find "$LOG_DIR" -maxdepth 1 -type f -mtime "+${MAX_AGE_DAYS}" -print -delete

echo "Rotação concluída: removidos logs com mais de ${MAX_AGE_DAYS} dias em ${LOG_DIR}."

# --- .gitignore correspondente (adicione uma vez, fora deste script) ---
# .agent-logs/
#
# Se a pasta já foi commitada antes, tirar do rastreamento sem apagar do disco:
#   git rm -r --cached caminho/para/.agent-logs
#   git commit -m "Remove log operacional do controle de versão"
