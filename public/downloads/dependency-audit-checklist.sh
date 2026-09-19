#!/usr/bin/env bash
#
# ⚠️ AVISO LEGAL: este script é fornecido "como está", sem garantias de
# qualquer tipo, extraído e adaptado de um caso real para uso genérico.
# Não foi testado no seu ambiente. Leia, entenda e adapte antes de usar
# em produção. O autor não se responsabiliza por qualquer dano, perda de
# dados ou mau funcionamento decorrente do uso deste conteúdo.
#
# Checklist de auditoria de dependências: roda o audit do gerenciador de
# pacotes, separa achado corrigível sem mudança de major (baixo risco) de
# achado que exige revisão manual, e força rebuild + teste real depois de
# qualquer correção — nunca confie só no exit code do fix automático.
#
# Lição por trás: a vulnerabilidade quase nunca está numa dependência que
# você importou de propósito — está numa dependência transitiva que veio
# junto (ex.: um parser de query string usado por baixo de um framework
# HTTP), instalada há meses sem ninguém pensar nela. "Zero vulnerabilidade
# conhecida" é uma foto do agora, não uma garantia permanente: uma CVE nova
# pode ser publicada amanhã pra um pacote que já está parado no seu
# node_modules há um ano, sem nenhuma mudança de código sua ter acontecido.
# Por isso a auditoria precisa rodar por rotina (cron, CI periódico), não
# só quando alguém lembra ou quando adiciona um pacote novo.
#
# Uso: adapte o gerenciador (aqui assume npm; troque por yarn/pnpm/pip-audit/
# etc conforme o seu stack) e rode periodicamente, ex.:
#   0 6 * * 1 /caminho/para/dependency-audit-checklist.sh /caminho/do/projeto

set -euo pipefail

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

echo "=== auditando dependências em: $(pwd) ==="

AUDIT_JSON="$(npm audit --json || true)"

TOTAL=$(echo "$AUDIT_JSON" | grep -o '"total":[0-9]*' | head -n1 | cut -d: -f2 || echo 0)

if [ -z "$TOTAL" ] || [ "$TOTAL" = "0" ]; then
  echo "nenhuma vulnerabilidade conhecida no momento desta checagem."
  echo "lembrete: isso descreve o CVE catalogado até agora, não uma garantia futura — rode de novo na próxima janela."
  exit 0
fi

echo "$TOTAL vulnerabilidade(s) conhecida(s) encontrada(s)."
echo
echo "--- passo 1: o que o fix automático resolve sem mudança de major ---"
npm audit fix --dry-run 2>&1 | tail -n 40 || true

echo
echo "--- passo 2: aplique o fix de baixo risco, depois rebuild + teste real ---"
echo "npm audit fix                     # aplica só correções semver-compatíveis"
echo "npm install && npm run build      # rebuild do zero — 'fix disponível' não é 'fix testado'"
echo "npm audit --json | grep '\"total\"' # confirme que caiu pra 0 (ou o que restar exige revisão manual)"
echo
echo "--- passo 3: o que sobrar depois do fix automático exige revisão manual ---"
echo "vulnerabilidade que só resolve com bump de major pode quebrar API — não aplique 'npm audit fix --force' sem ler o changelog da versão nova e testar de verdade."
