# Checklist: `trust proxy` — rate limit por IP só funciona se o app souber que está atrás de um proxy

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano, perda de dados ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Qualquer app atrás de um proxy reverso (Caddy, nginx, um load balancer, uma
CDN) recebe todas as conexões TCP de um único lugar: o proxy. Se o
middleware de rate limit usa o endereço de origem da conexão (`req.ip` no
Express, ou equivalente noutro framework) sem que o app tenha sido avisado
de que existe um proxy na frente, todo mundo — qualquer visitante, de
qualquer lugar do mundo — aparece como o mesmo IP: o do proxy.

Resultado prático: uma cota que deveria ser "N requisições por IP por
minuto" vira "N requisições por minuto pro site inteiro, somando todo mundo
junto". Ninguém percebe em teste manual isolado (uma pessoa testando sozinha
não nota diferença), mas basta duas pessoas normais usando o site ao mesmo
tempo pra uma rajada de uma derrubar a cota da outra com `429`. É
silencioso: não há erro de configuração, o rate limit *funciona*, só que
como uma torneira única em vez de uma por pessoa.

O inverso — confiar cegamente em `X-Forwarded-For` sem ter proxy nenhum, ou
sem limitar quantos hops são confiáveis — é igual de perigoso, só que na
direção oposta: qualquer cliente pode forjar esse header e escolher seu
próprio "IP" pra sempre ganhar uma cota nova, esvaziando o rate limit por
completo.

## A causa raiz

Frameworks web não assumem proxy por padrão (correto, por segurança — ver
seção abaixo). No Express, `req.ip` só reflete `X-Forwarded-For` se
`app.set('trust proxy', ...)` estiver configurado explicitamente. Sem isso,
todo `X-Forwarded-For` que o proxy manda é ignorado e `req.ip` fica sempre
igual ao IP de quem conectou na porta — o proxy.

O mesmo padrão existe (com nomes diferentes) em outros stacks: Django tem
`SECURE_PROXY_SSL_HEADER` + geralmente `django-ipware`/middleware próprio;
Rails tem `config.action_dispatch.trusted_proxies`; Nginx-como-upstream de
outro Nginx precisa de `set_real_ip_from` + `real_ip_header`. A causa raiz é
sempre a mesma: identidade de origem calculada a partir da conexão TCP crua
em vez do header que o proxy escreveu.

## A correção — e o cuidado que vem junto

No Express, a correção mínima é dizer exatamente **quantos hops de proxy
confiáveis** existem entre o navegador e o app — não simplesmente "confie em
tudo":

```js
// Só 1 proxy reverso confiável entre o navegador e este processo
// (ex.: um único Caddy/nginx na frente, sem CDN extra no meio).
// Isso faz req.ip usar o X-Forwarded-For mais à direita — o único
// hop que o proxy em si controla, não algo que o cliente escreveu.
app.set('trust proxy', 1)
```

Configurar como `true` (confia em qualquer `X-Forwarded-For`, de qualquer
profundidade) é o erro oposto: se não há N proxies confiáveis de verdade
entre o cliente e o app, um cliente malicioso pode escrever o próprio
`X-Forwarded-For` e escolher o IP que quiser — zerando o rate limit por
completo. O número certo é sempre "quantos proxies reais e confiáveis
existem nesse caminho", nunca um valor genérico copiado de outro projeto.

Frameworks de rate limit (`express-rate-limit` e equivalentes) geralmente
detectam essa configuração ausente e alertam no log ("`X-Forwarded-For`
header set but trust proxy setting is false") — não ignore esse aviso.

## Como testar de verdade

`curl` direto na origem (sem passar pelo proxy) nunca reproduz esse bug —
a origem TCP já é a sua máquina, igual seria o proxy em produção. É preciso
simular dois clientes diferentes *através* do proxy:

```bash
# Dois IPs de origem diferentes, mesma rota de rate limit, via proxy real
curl -s -o /dev/null -w '%{http_code}\n' \
  -H 'X-Forwarded-For: 203.0.113.10' https://seu-dominio/api/rota-limitada
curl -s -o /dev/null -w '%{http_code}\n' \
  -H 'X-Forwarded-For: 203.0.113.20' https://seu-dominio/api/rota-limitada
```

Sem `trust proxy` configurado corretamente, os dois batem na mesma cota
(o segundo pode já vir `429` se o primeiro esgotou o limite). Com a
configuração certa, cada `X-Forwarded-For` diferente isola seu próprio
bucket — teste também que forjar um header absurdo (mais hops do que o
configurado) **não** consegue escapar do limite.

## Checklist

- [ ] O app sabe que está atrás de um proxy (`trust proxy`/equivalente
      configurado), não usando o comportamento default sem proxy.
- [ ] O número de hops confiáveis configurado é exato — não `true`/"confia
      em tudo", nem maior que o número real de proxies no caminho.
- [ ] Testado com dois `X-Forwarded-For` diferentes através do proxy real
      (não `curl` direto na origem) confirmando buckets de rate limit
      isolados.
- [ ] Testado que forjar mais hops do que o configurado não some com o
      rate limit.
- [ ] Qualquer outro middleware que dependa de IP do cliente (log,
      geolocalização, bloqueio por IP) foi revisado com o mesmo cuidado —
      o mesmo bug afeta qualquer um deles, não só rate limit.
