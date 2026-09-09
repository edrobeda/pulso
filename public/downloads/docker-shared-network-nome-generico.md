# Nota: numa rede Docker compartilhada, `api`/`db`/`web` pode resolver pro container errado

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano, perda de dados, indisponibilidade ou mau funcionamento decorrente do
> uso deste conteúdo — a responsabilidade de validar é sempre de quem executa.

## O problema

Vários projetos `docker compose` no mesmo host, ligados a uma rede Docker
externa compartilhada (pra um proxy reverso único alcançar todos). Cada
`compose.yml` chama seu backend de `api`, seu banco de `db`, seu front de
`web` — nomes genéricos, porque dentro de um projeto isolado isso nunca dá
problema.

Na rede compartilhada, porém, o DNS embutido do Docker (`127.0.0.11`)
resolve um nome de serviço para **todos** os containers que têm aquele
nome como alias de rede. `api` passa a ter dois (ou mais) endereços A. Cada
`proxy_pass http://api:3000` no nginx, cada `connect('db')` no app, sorteia
um dos IPs a cada resolução — e metade das vezes cai no backend de outro
projeto, que responde `404`, `Connection refused`, ou pior: `200` com o
corpo errado.

O sintoma é intermitente e não gera erro em lugar nenhum: o nginx acha que
fez o proxy certo, o backend certo não registra a request (ela nem chegou),
e o backend errado só loga um `404` anônimo no meio de milhares. Recarregar
"resolve" (novo sorteio), então fecha como "não reproduzo".

## O que fazer

1. **Referencie pelo nome único do container, não pelo alias de serviço.**
   Defina `container_name: meuprojeto_api` (ou deixe o Docker gerar
   `projeto-api-1` e use esse) e aponte o proxy/app pra ele. Nome de
   container é único no daemon inteiro — não colide entre projetos.

2. **Ou dê um alias de rede explícito e específico do projeto** na seção
   `networks` do serviço (`aliases: [meuprojeto-api]`) e use só esse alias
   nas referências. O alias curto `api` continua existindo pra quem estiver
   dentro do mesmo projeto, mas você para de depender dele.

3. **Melhor ainda: não compartilhe a rede à toa.** Cada projeto numa rede
   interna própria; só o proxy reverso participa de todas. Aí `api` volta a
   ser inequívoco dentro de cada rede e o proxy alcança cada backend por um
   nome que só existe numa rede.

4. **Cuidado com o cache de resolução.** Depois de trocar pra nome único,
   um proxy que resolve uma vez no boot (nginx sem `resolver`) pode ainda
   estar segurando o IP antigo — recarregue/reinicie o proxy e confirme.

## Como confirmar qual é o caso

```sh
# Quantos containers respondem pelo nome que você usa no proxy_pass?
# (rode de dentro de um container ligado na mesma rede)
getent hosts api
# duas ou mais linhas = nome ambíguo, você está sorteando backend

# Ou pelo lado do daemon: liste os aliases da rede compartilhada
docker network inspect NOME_DA_REDE \
  --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{"\n"}}{{end}}'

# Teste de misroteamento: bata N vezes na URL pública e veja se o
# status/corpo varia sem nada ter mudado
for i in $(seq 1 20); do
  curl -o /dev/null -s -w '%{http_code} ' https://SEU_DOMINIO/rota-da-api/health
done; echo
# saída tipo "200 200 404 200 404 ..." = backend errado no meio
```

## Regra geral

Nome de serviço no compose é um identificador *local ao projeto*. No
momento em que duas stacks dividem uma rede, o namespace deixou de ser
local — e qualquer nome genérico (`api`, `db`, `cache`, `web`, `worker`)
vira uma aposta. Trate a rede compartilhada como um espaço de nomes global
e nomeie de acordo.
