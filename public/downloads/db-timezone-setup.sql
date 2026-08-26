-- ⚠️ Aviso legal: este material é fornecido "como está", sem garantias de
-- qualquer tipo, extraído e adaptado de um caso real para uso genérico.
-- Leia, entenda e teste em ambiente de homologação antes de aplicar em
-- produção. O autor não se responsabiliza por qualquer dano, perda de
-- dados ou mau funcionamento decorrente do uso deste conteúdo.
--
-- Problema real que isso resolve: um servidor cujo SO roda em UTC, mas
-- cujos usuários (e a lógica de negócio) pensam em outro fuso horário,
-- pode gravar `CURRENT_DATE`/`CURRENT_TIMESTAMP` com o dia errado em
-- qualquer janela que cruze meia-noite UTC mas não meia-noite local.
-- Exemplo: America/Sao_Paulo é UTC-3, então das 21h às 23:59 (horário
-- local) o UTC já virou o dia seguinte — `CURRENT_DATE` no Postgres
-- (que por padrão segue o timezone da sessão/servidor) grava a data de
-- amanhã para um evento que, pro usuário, aconteceu hoje à noite.

-- 1) Fixar o timezone no nível do banco (Postgres), afeta toda sessão nova:
ALTER DATABASE seu_banco SET timezone TO 'America/Sao_Paulo';

-- 2) Ou, se preferir não mudar o banco inteiro, fixar por sessão/conexão
--    (ex.: no início de cada transação do seu backend):
SET timezone TO 'America/Sao_Paulo';

-- 3) Confirmar o que está valendo agora:
SHOW timezone;
SELECT now(), current_date;

-- Lição: decida explicitamente em que timezone seu banco pensa — não
-- deixe isso implícito no timezone do SO do container, que normalmente
-- é UTC por padrão em imagens Docker. E teste especificamente a janela
-- de virada de dia (21h-00h em fusos UTC-3), que é onde esse bug fica
-- invisível no resto do dia.
