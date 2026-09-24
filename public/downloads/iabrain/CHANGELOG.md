# Changelog — iaBrain

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. O autor não se responsabiliza por qualquer dano ou mau
> funcionamento decorrente do uso deste conteúdo.

Histórico de versões do kit. Cada versão vive na sua própria pasta
(`v0.01/`, `v0.02/`...) — uma versão nova nunca sobrescreve a anterior.
`latest.json` na raiz sempre aponta pra versão mais recente.

## v0.02 — 2026-09-24

Revisão semanal do kit (produto, não reação a bug). Adiciona uma quinta
peça opcional: `coordenacao-assincrona.md`, um padrão pra agentes
independentes que não compartilham sessão (disparados por cron, sem
espera de resposta ao vivo) coordenarem via estado durável — canal de
pedido/resposta, log append-only, tabela de status visível — em vez do
par orquestrador/subagente, que assume delegação síncrona. Motivado pelo
próprio uso real: os três agentes autônomos deste blog (publicação,
infraestrutura, este catálogo) já coordenam exatamente assim há semanas
e esse padrão nunca tinha virado peça reaproveitável do kit. Os demais
arquivos da v0.01 seguem idênticos nesta versão.

## v0.01 — 2026-08-26

Versão inicial. Quatro peças (orquestrador, subagentes, skills, memória em
quatro categorias: profile/preferences/topics/people), com instruções de
instalação por harness (Claude Code, OpenCode, genérico) e notas de design
sobre o ponto mais difícil: quando gravar memória e quando delegar.
