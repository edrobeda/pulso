# Template: sensor de estado por rodada (iaBrain v0.06)

> ⚠️ **Aviso legal**: fornecido "como está", sem garantias de qualquer
> tipo. Leia, entenda e adapte antes de usar. O autor não se responsabiliza
> por qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## Por que isso é uma peça separada

`coordenacao-assincrona.md` já cobre uma tabela de status (histórico
consultável, uma linha por evento) e um log append-only. Os dois exigem
alguma infraestrutura — banco de dados, ou pelo menos um arquivo que
cresce e precisa de rotação. Existe um padrão mais barato e mais rápido
de checar, que resolve uma pergunta específica e recorrente sem exigir
nenhum dos dois: **"a última rodada deste agente terminou bem, e ela
precisa de alguma decisão minha?"** — sem ler log, sem consultar tabela,
sem abrir o histórico inteiro.

## O padrão

No fim de toda rodada (sucesso ou falha), o agente sobrescreve um arquivo
JSON pequeno e fixo, só com o estado da rodada mais recente — não
acumula, não é append-only, é sempre a "última foto":

```json
{
  "shipped": true,
  "summary": "resumo de uma frase do que foi entregue ou verificado",
  "needs_input": false
}
```

Três campos, sempre os mesmos três, em toda rodada de todo agente do
mesmo sistema (convenção compartilhada, não uma escolha por agente):

- **`shipped`** (`boolean`) — a rodada mudou algo persistente (código,
  conteúdo, config) ou só verificou e não achou nada pra fazer? Força o
  agente a admitir uma rodada vazia em vez de inventar uma entrega fraca
  só para preencher o campo.
- **`summary`** (string curta) — uma frase, não um relatório. Serve pra
  quem só tem tempo de dar uma olhada rápida (humano no celular, outro
  agente decidindo se vale a pena ler mais a fundo) decidir se precisa
  investigar mais.
- **`needs_input`** (`boolean`) — existe uma pergunta/decisão esperando
  resposta humana (tipicamente registrada no canal de pedido/resposta de
  `coordenacao-assincrona.md`)? Separado de `shipped` de propósito: uma
  rodada pode entregar algo **e** ainda precisar de uma decisão pendente
  sobre outra coisa, ou não entregar nada só porque está travada
  esperando resposta — as quatro combinações são estados reais e
  diferentes entre si.

## Por que um arquivo sobrescrito, e não mais uma tabela

Não substitui a tabela de status nem o log append-only — é uma camada
mais barata, intencionalmente sem histórico, pensada pra três leitores
específicos:

1. **A próxima rodada do mesmo agente**, no início da execução, decidindo
   se precisa agir diferente por causa do que aconteceu na vez anterior
   (ex.: a rodada passada ficou `needs_input: true` e nada mudou desde
   então → não abrir um pedido duplicado).
2. **Um humano olhando por fora**, sem precisar de acesso a banco de dados
   nem permissão pra ler log — só `cat` num arquivo, ou uma rotina simples
   de monitoramento externo (um watchdog, um script de abertura de sessão)
   que lê o JSON e decide se vale avisar alguém.
3. **Outro processo do mesmo sistema** (orquestrador, painel, o harness que
   disparou o agente) que precisa de uma resposta imediata — sim/não — sem
   pagar o custo de uma consulta.

Não exige banco, não exige rotação (é sempre um arquivo só, do mesmo
tamanho), e não precisa de nenhuma lógica de leitura por amostra — é
sempre a última rodada, ponto.

## Checklist pra aplicar num agente agendado já existente

- [ ] O arquivo é escrito (sobrescrito, não anexado) **sempre** ao fim da
      rodada — sucesso, falha, ou rodada sem entrega — nunca só no
      caminho feliz.
- [ ] `shipped: false` é uma saída válida e esperada, não um estado de
      erro — uma rodada que verificou e genuinamente não achou nada pra
      fazer é diferente de uma rodada que quebrou.
- [ ] `summary` é sempre uma frase, nunca um objeto/lista — o valor dele
      é ser lido em menos de três segundos.
- [ ] `needs_input` reflete o canal de pedido/resposta real (ex.: existe
      uma entrada `[PENDENTE]` aberta por este agente?), não um
      sentimento vago de "talvez devesse perguntar algo".
- [ ] O nome do arquivo identifica o agente (`.last-<agente>-run.json`)
      quando mais de um agente roda no mesmo projeto — evita um agente
      sobrescrever o sensor de outro por engano.
- [ ] Nenhum dado sensível (credencial, caminho interno, nome de outro
      serviço) entra no `summary` — mesmo quando o arquivo não é
      servido publicamente, trate como se pudesse ser lido por alguém
      fora do contexto completo do sistema.

## Quando isso não é suficiente sozinho

Esse sensor só é escrito se a rodada chegar até o fim do próprio código —
a mesma ressalva de `verificacao-e-reversao.md` e da lição "verificação
que só o processo vê": se a falha acontece antes disso (erro de
autenticação da ferramenta que executa o agente, timeout travado sem
`flock`, crash do interpretador), o arquivo simplesmente não é
atualizado e continua mostrando o estado da última rodada que funcionou —
parecendo tudo bem, quando na verdade a rodada seguinte nunca rodou de
verdade. Por isso o sensor de estado complementa, mas não substitui, um
watchdog externo ao processo (ver `verificacao-que-so-o-processo-ve` no
catálogo de lições) quando a frequência/criticidade do agente justificar
esse nível extra.
