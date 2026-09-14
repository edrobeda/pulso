# Checklist: uma verificação que só o processo vê equivale a não ter verificação

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo, extraído e adaptado de um caso real para uso genérico.
> É um ponto de partida, não uma solução pronta — adapte e teste no seu
> próprio ambiente antes de confiar nele. O autor não se responsabiliza por
> qualquer dano, perda de dados ou mau funcionamento decorrente do uso
> deste conteúdo.

## O problema, em uma frase

Um job agendado (backup, sincronização, limpeza, qualquer rotina que roda
sozinha) pode ter uma verificação de sucesso/falha impecável — testa
integridade, calcula checksum, confere tamanho mínimo — e mesmo assim
falhar silenciosamente do ponto de vista de quem depende dele, se o
resultado dessa verificação só existir dentro de um log local que ninguém
olha. A verificação técnica está correta; o problema é de visibilidade.
Passam-se dias ou semanas até alguém abrir aquele log por outro motivo e
notar que o job vem falhando desde uma data qualquer no passado.

## Por que isso passa despercebido

- `exit 0` do cron não aparece em lugar nenhum por padrão — quem não
  monitora ativamente o próprio crontab não vê nada, sucesso ou falha.
- Um arquivo de log cresce sem alarme — não é um erro, é ausência de
  sinal positivo, e ausência de sinal não dispara nada sozinha.
- É fácil confundir "eu implementei a verificação" com "esse job está
  monitorado" — são coisas diferentes. A primeira garante que o problema
  *pode* ser detectado; a segunda garante que *alguém vai* detectar.

## O padrão que resolve

1. **Grave cada execução como uma linha de histórico**, não como um
   arquivo de log solto — sucesso/falha, timestamp, um número relevante
   (tamanho do arquivo gerado, quantidade de itens processados). Uma
   tabela pequena (`job_runs`: id, job_name, ran_at, ok, detail) resolve
   pra qualquer linguagem/stack.
2. **Exponha o último resultado onde um humano de fato passa o olho** —
   não precisa ser um dashboard de observability dedicado; um endpoint
   simples (`GET /status/<job>`) lido por uma página que você já visita
   (um painel interno, uma página de status pública) já transforma
   "verificação que existe" em "verificação que alguém vê".
3. **Não vaze detalhe sensível na exposição pública** — se a página de
   status for pública, mostre só o essencial (ok/falha, quando foi a
   última vez, tamanho aproximado) e nunca caminho de arquivo, hostname
   interno, nome de outro serviço compartilhado ou credencial.
4. **O alarme certo é passivo, não um e-mail que ninguém lê** — a barra
   mais baixa que funciona de verdade costuma ser "alguém bate o olho
   numa página que já visita todo dia" antes de "configurar um sistema de
   alerta ativo (e-mail, Slack, PagerDuty) que também pode ser ignorado".
   Adicione alerta ativo depois, se o passivo não for suficiente — não
   troque um pelo outro.

## Exemplo mínimo (SQL + pseudocódigo de endpoint)

```sql
-- tabela de histórico de execução de um job agendado, genérica pra qualquer job
CREATE TABLE IF NOT EXISTS job_runs (
  id SERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ok BOOLEAN NOT NULL,
  detail TEXT  -- ex.: tamanho do arquivo, contagem processada, mensagem curta de erro
);

-- ao fim de cada execução do job (sucesso OU falha, sempre grava uma linha):
INSERT INTO job_runs (job_name, ok, detail) VALUES ('nome-do-job', true, 'tamanho=42MB');
```

```text
GET /status/nome-do-job  →  { "ok": true, "last_run_at": "...", "detail": "tamanho=42MB" }
```

A página de status pública lê esse endpoint e mostra só um indicador
simples (✅/❌ + "última vez: há N horas") — sem caminho, sem host, sem
nome de outro serviço.

## Checklist rápido pra aplicar num job já existente

- [ ] O job grava uma verificação de sucesso/falha real (não só `exit 0`
      cego)? Se não, resolva isso primeiro — visibilidade de uma
      verificação ruim ainda é uma verificação ruim.
- [ ] O resultado de cada execução vira uma linha de histórico, não só
      um log que sobrescreve/acumula sem estrutura?
- [ ] Existe um lugar (endpoint, página) onde um humano vê esse status
      sem precisar entrar no servidor e ler log?
- [ ] Se esse lugar for público, ele omite todo detalhe interno
      (caminho, host, nome de outro serviço, credencial)?
- [ ] Uma falha muda visivelmente o indicador (não fica preso no último
      estado bom até alguém investigar por outro motivo)?
