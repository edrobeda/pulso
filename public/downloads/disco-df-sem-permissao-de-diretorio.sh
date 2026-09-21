#!/usr/bin/env bash
#
# ⚠️ AVISO LEGAL: este script é fornecido "como está", sem garantias de
# qualquer tipo, extraído e adaptado de um caso real para uso genérico.
# Não foi testado no seu ambiente. Leia, entenda e adapte antes de usar
# em produção. O autor não se responsabiliza por qualquer dano, perda de
# dados ou mau funcionamento decorrente do uso deste conteúdo.
#
# Lição por trás: `df` opera no nível do sistema de arquivos inteiro
# (mountpoint), não checa permissão de pasta nenhuma dentro dele — dá pra
# ver quanto um disco compartilhado está cheio mesmo sem NENHUM acesso de
# leitura às pastas que estão de fato enchendo ele (essas exigiriam `ls`/
# `du` pasta por pasta, aí sim bloqueado por permissão). Não assuma que
# "não tenho acesso pra diagnosticar a causa" significa "não tenho acesso
# pra nem medir o total" — são duas permissões diferentes.
#
# Uso: liste os mountpoints que te preocupam (não precisa ser dono nem ter
# leitura de nenhuma pasta neles) e rode por cron com frequência regular:
#   0 * * * * /caminho/para/disco-df-sem-permissao-de-diretorio.sh >> /caminho/log.log 2>&1
#
# Combine com o template de tendência (resource-trend-snapshot.sh nesta
# mesma coleção) pra gravar o percentual como série temporal em vez de só
# imprimir o valor do momento.

set -euo pipefail

MOUNTS=("/" "/mnt/algum-volume-compartilhado")   # <-- ajuste
WARN_PERCENT=85                                   # <-- avisa a partir daqui
CRITICAL_PERCENT=95                               # <-- crítico a partir daqui

TIMESTAMP="$(date -u +%FT%TZ)"
EXIT_CODE=0

for MOUNT in "${MOUNTS[@]}"; do
  if [ ! -e "$MOUNT" ]; then
    echo "${TIMESTAMP} aviso: mountpoint '${MOUNT}' não existe neste host, pulando."
    continue
  fi

  # `df -P` (POSIX output, uma linha, formato estável pra parsing) só
  # precisa conseguir dar `stat`/`statfs` no mountpoint — não lista
  # conteúdo, não precisa de permissão de leitura em pasta nenhuma dentro
  # dele. Funciona mesmo se todo o conteúdo pertencer a outro usuário.
  LINE="$(df -P "$MOUNT" | tail -n1)"
  USED_PERCENT="$(echo "$LINE" | awk '{print $5}' | tr -d '%')"
  AVAIL_KB="$(echo "$LINE" | awk '{print $4}')"

  echo "${TIMESTAMP} ${MOUNT}: ${USED_PERCENT}% usado, ${AVAIL_KB}KB disponível"

  if [ "$USED_PERCENT" -ge "$CRITICAL_PERCENT" ]; then
    echo "${TIMESTAMP} CRÍTICO: ${MOUNT} em ${USED_PERCENT}% (limiar crítico: ${CRITICAL_PERCENT}%)"
    # substitua pela sua notificação real (webhook, e-mail, registro visível)
    # notify.sh "disco ${MOUNT} em ${USED_PERCENT}%, crítico"
    EXIT_CODE=2
  elif [ "$USED_PERCENT" -ge "$WARN_PERCENT" ]; then
    echo "${TIMESTAMP} aviso: ${MOUNT} em ${USED_PERCENT}% (limiar de aviso: ${WARN_PERCENT}%)"
    EXIT_CODE=1
  fi
done

# Se algum mount não pôde ser diagnosticado (qual pasta específica está
# enchendo), isso é um problema separado — de causa raiz, não de
# visibilidade do total. Registre como pedido pra quem tem o acesso que
# falta, mas não deixe a falta desse acesso bloquear o alerta básico
# acima, que já funciona sem ele.

exit "$EXIT_CODE"
