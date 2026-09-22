-- ⚠️ AVISO LEGAL: este script é fornecido "como está", sem garantias de
-- qualquer tipo, extraído e adaptado de um caso real para uso genérico.
-- Não foi testado no seu ambiente. Leia, entenda e adapte antes de usar
-- em produção. O autor não se responsabiliza por qualquer dano, perda de
-- dados ou mau funcionamento decorrente do uso deste conteúdo.
--
-- Template: cálculo de % de disponibilidade auto-monitorada (sem serviço
-- de terceiro) que NÃO subestima uma falha do próprio processo de checar.
--
-- Lição por trás: um checker periódico que testa suas próprias dependências
-- (banco, um serviço interno, o que for) e grava uma linha por checagem
-- parece óbvio de calcular: `% = linhas_ok / total_de_linhas`. Esse cálculo
-- tem um ponto cego específico: se o PRÓPRIO checker cair (crash, deploy,
-- container reiniciando, processo travado) nenhuma linha nova é gravada
-- durante a queda — não existe uma linha "ok = false" pra aquele período,
-- existe ausência total de dado. `linhas_ok / total_de_linhas` divide só
-- pelo que existe, então um buraco de horas sem nenhuma linha não muda a
-- proporção nem um pouco: o painel mostra 100% justamente na janela em que
-- ninguém sabe se estava tudo bem, porque o próprio termômetro estava
-- quebrado. É o cenário mais importante de pegar (o monitoramento morrer)
-- sendo exatamente o único que o cálculo ingênuo não enxerga.
--
-- A correção: o denominador não é "quantas linhas existem", é "quantas
-- checagens deveriam ter acontecido no período, dado o intervalo
-- configurado" — um número fixo, calculado a partir do relógio, não da
-- tabela. Linha ausente dentro dessa janela esperada conta como falha,
-- não como "sem dado".

-- Schema mínimo de exemplo (ajuste nomes):
-- CREATE TABLE uptime_checks (
--   id          bigserial PRIMARY KEY,
--   target      text NOT NULL,        -- ex.: 'db', 'frontend', 'api-externa'
--   ok          boolean NOT NULL,
--   latency_ms  integer,
--   error       text,
--   checked_at  timestamptz NOT NULL DEFAULT now()
-- );
-- Rode a checagem a cada N minutos (CHECK_INTERVAL_MINUTES abaixo) e grave
-- uma linha por alvo a cada rodada, sucesso ou falha.

-- Errado (comum, parece óbvio, esconde queda do próprio checker):
--   SELECT target, 100.0 * count(*) FILTER (WHERE ok) / count(*) AS uptime_pct
--   FROM uptime_checks
--   WHERE checked_at > now() - interval '24 hours'
--   GROUP BY target;
-- Se o checker ficou 6h sem rodar dentro dessas 24h, essas 6h simplesmente
-- não têm linha — o `count(*)` do denominador encolhe junto, e o resultado
-- pode continuar mostrando 99-100% mesmo com um buraco de 6h sem garantia
-- nenhuma de que estava tudo bem.

-- Certo: denominador fixo, calculado do intervalo configurado, não da
-- tabela. Ajuste CHECK_INTERVAL_MINUTES pro valor real do seu cron/setInterval.
-- Troque `24 hours`/`7 days` pelas janelas que fizerem sentido pro seu caso.

-- Exemplo em SQL puro (Postgres), parametrizando o intervalo via CTE:
WITH params AS (
  SELECT 5 AS check_interval_minutes  -- <-- ajuste pro intervalo real do seu checker
),
expected AS (
  SELECT
    ceil(24 * 60 / (SELECT check_interval_minutes FROM params))::int AS expected_24h,
    ceil(7 * 24 * 60 / (SELECT check_interval_minutes FROM params))::int AS expected_7d
)
SELECT
  target,
  -- min(100, ...) porque múltiplas checagens na mesma janela (retry, delay)
  -- não devem inflar acima de 100%
  least(100.0, 100.0 * count(*) FILTER (WHERE ok AND checked_at > now() - interval '24 hours')
    / (SELECT expected_24h FROM expected)) AS uptime_pct_24h,
  least(100.0, 100.0 * count(*) FILTER (WHERE ok AND checked_at > now() - interval '7 days')
    / (SELECT expected_7d FROM expected)) AS uptime_pct_7d
FROM uptime_checks
WHERE checked_at > now() - interval '7 days'
GROUP BY target;

-- Retenção: sem isso a tabela cresce sem limite (1 linha por alvo a cada
-- intervalo, pra sempre). Se você só expõe 7 dias, não precisa guardar mais
-- que isso — rode periodicamente (mesmo processo que grava, ou um cron
-- separado):
--   DELETE FROM uptime_checks WHERE checked_at < now() - interval '7 days';

-- Checklist rápido antes de considerar "disponibilidade auto-monitorada"
-- pronta:
-- [ ] Denominador é uma contagem de janelas esperadas (tempo / intervalo),
--     não count(*) das linhas que existem.
-- [ ] Testado de propósito: pare o processo que faz a checagem por um
--     tempo (ou derrube o container) e confirme que o % cai quando ele
--     volta — se continuar em ~100%, o denominador ainda está errado.
-- [ ] Retenção configurada (a tabela não cresce pra sempre).
-- [ ] Se o alvo testado é um serviço interno (não público), teste pela
--     rede interna (nome de container, não domínio público) — evita que a
--     checagem dependa de DNS/proxy externos só pra medir a própria saúde.
