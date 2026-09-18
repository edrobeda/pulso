#!/usr/bin/env python3
#
# AVISO LEGAL: este script é fornecido "como está", sem garantias de
# qualquer tipo, extraído e adaptado de um caso real para uso genérico.
# Não foi testado no seu ambiente. Leia, entenda e adapte antes de usar
# em produção. O autor não se responsabiliza por qualquer dano, perda de
# dados ou mau funcionamento decorrente do uso deste conteúdo.
#
# Lição por trás: scanner de segredo por padrão/assinatura de fornecedor
# (o que gitleaks, GitHub secret scanning e a maioria das ferramentas
# prontas fazem) só reconhece credencial de um formato já catalogado
# (prefixo fixo tipo chave de nuvem, token de Git host, chave de
# pagamento...). Um bearer token ad-hoc de um serviço interno, ou de um
# conector novo (cada vez mais comum em arquivo de configuração de
# agente/MCP), não tem prefixo nenhum reconhecível — é só uma string
# opaca. O scanner não erra: ele simplesmente não tem regra pra aquele
# formato, e devolve "arquivo limpo" com a mesma confiança de quando
# realmente está limpo. Isso não substitui scan por padrão (que continua
# pegando a maioria dos casos catalogados) — é um complemento: qualquer
# valor literal atribuído a uma chave com nome de credencial, com
# entropia alta o suficiente pra parecer aleatório, merece revisão
# manual mesmo sem bater com nenhum padrão conhecido.
#
# Uso:
#   python3 secret-scan-padrao-vs-entropia.py <arquivo-ou-pasta> [...]
#
# Sem dependência externa (só biblioteca padrão). Saída: uma linha por
# achado suspeito, classificado como "padrão conhecido" (já seria pego
# por gitleaks/scanner tradicional) ou "sem padrão conhecido" (o caso
# que este script existe pra cobrir). Exit code 1 se achou algo, 0 se
# não achou nada suspeito — útil como gate de CI.

import math
import os
import re
import sys

# Nomes de chave que sugerem credencial. Ajuste pro vocabulário do seu
# projeto (ex.: idioma, convenção de nome interna).
KEY_PATTERN = re.compile(
    r"(token|secret|key|password|senha|credential|credencial|auth|api[_-]?key)",
    re.IGNORECASE,
)

# Assinaturas de fornecedor conhecido — se o valor bate com uma dessas,
# um scanner tradicional (gitleaks etc.) já pegaria. Liste as que
# importam pro seu contexto; isto é só um ponto de partida.
KNOWN_VENDOR_PATTERNS = [
    re.compile(r"^AKIA[0-9A-Z]{16}$"),           # AWS access key
    re.compile(r"^gh[pousr]_[A-Za-z0-9]{36,}$"),  # GitHub token
    re.compile(r"^sk_(live|test)_[A-Za-z0-9]{24,}$"),  # Stripe
    re.compile(r"^xox[baprs]-[A-Za-z0-9-]{10,}$"),     # Slack
    re.compile(r"^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$"),  # JWT
]

# Coisas que parecem valor mas não são credencial hardcoded de verdade —
# referência de variável, placeholder de template, vazio.
PLACEHOLDER_PATTERN = re.compile(
    r"^\s*$|\$\{.*\}|^\$[A-Z_][A-Z0-9_]*$|<.*>|\bYOUR_|\bxxx|\bTODO\b|^\.\.\.$",
    re.IGNORECASE,
)

MIN_LENGTH = 16
ENTROPY_THRESHOLD = 3.5  # bits/char — ajuste conforme falso-positivo/negativo do seu caso

VALUE_LINE = re.compile(r"""^\s*["']?([\w.\-]+)["']?\s*[:=]\s*["']?([^"'#,\n]+)["']?""")

SCAN_EXTENSIONS = {".json", ".yaml", ".yml", ".env", ".toml", ".ini", ".cfg", ".conf"}


def shannon_entropy(s):
    if not s:
        return 0.0
    freq = {}
    for ch in s:
        freq[ch] = freq.get(ch, 0) + 1
    length = len(s)
    return -sum((count / length) * math.log2(count / length) for count in freq.values())


def classify(value):
    if PLACEHOLDER_PATTERN.search(value):
        return None
    if len(value) < MIN_LENGTH:
        return None
    for pattern in KNOWN_VENDOR_PATTERNS:
        if pattern.match(value):
            return "padrão conhecido (scanner tradicional já pegaria)"
    entropy = shannon_entropy(value)
    if entropy >= ENTROPY_THRESHOLD:
        return f"sem padrão conhecido, entropia alta ({entropy:.2f} bits/char)"
    return None


def scan_file(path):
    findings = []
    try:
        with open(path, "r", errors="ignore") as f:
            for line_no, line in enumerate(f, start=1):
                match = VALUE_LINE.match(line)
                if not match:
                    continue
                key, value = match.group(1), match.group(2).strip()
                if not KEY_PATTERN.search(key):
                    continue
                classification = classify(value)
                if classification:
                    findings.append((path, line_no, key, classification))
    except (UnicodeDecodeError, PermissionError):
        pass
    return findings


def iter_target_files(paths):
    for path in paths:
        if os.path.isfile(path):
            yield path
        elif os.path.isdir(path):
            for root, _dirs, files in os.walk(path):
                for name in files:
                    if os.path.splitext(name)[1].lower() in SCAN_EXTENSIONS:
                        yield os.path.join(root, name)


def main():
    if len(sys.argv) < 2:
        print(f"uso: {sys.argv[0]} <arquivo-ou-pasta> [...]")
        return 2

    all_findings = []
    for target in iter_target_files(sys.argv[1:]):
        all_findings.extend(scan_file(target))

    if not all_findings:
        print("nenhum valor suspeito encontrado.")
        return 0

    for path, line_no, key, classification in all_findings:
        print(f"{path}:{line_no}: chave '{key}' — {classification}")

    print(f"\n{len(all_findings)} achado(s). Revise manualmente antes de decidir se é credencial de verdade.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
