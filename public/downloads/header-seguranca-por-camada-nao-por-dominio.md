# Checklist: um header de segurança setado num middleware não cobre o domínio inteiro

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano, perda de dados ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Um header de resposta HTTP (`Strict-Transport-Security`,
`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`...) é uma propriedade de cada **resposta**, não do
**domínio**. Quando o mesmo domínio público é servido por mais de um
processo independente — uma API atrás de um middleware (`helmet` no
Express, `secure_headers` no Rails, etc.) e, em paralelo, um proxy reverso
ou servidor estático (nginx, Caddy, um CDN) entregando o HTML/JS/CSS da
SPA — cada um desses processos só manda os headers que ele mesmo foi
configurado para mandar. Ativar um header no middleware da API não "vaza"
para as respostas que vêm do nginx, mesmo que o navegador, pro usuário
final, veja só um domínio só. É fácil não notar: nada dá erro, a página
carrega normal, e sem comparar os headers reais de cada rota não existe
sinal nenhum de que a proteção só cobre metade do tráfego.

Caso real: `Strict-Transport-Security` estava presente nas respostas da
API (configurado via `helmet`), mas as respostas do nginx que servia a SPA
(HTML, JS, CSS) não mandavam o header nenhum — só foi percebido comparando
`curl -I` nas duas rotas lado a lado em produção.

## Por que isso é traiçoeiro

- **HSTS é o único desses headers com efeito "memorizado"**: depois que o
  navegador recebe `Strict-Transport-Security` de qualquer resposta
  daquele domínio, ele força HTTPS pro domínio inteiro por `max-age`
  segundos — mas só depois da primeira resposta que o entregou. Até lá (e
  pra qualquer visitante que nunca bateu na rota que manda o header), a
  proteção simplesmente não existe pra aquela rota.
- **CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy não têm
  esse efeito de memória nenhum** — são avaliados resposta por resposta,
  sempre. Se a rota que serve o HTML principal não manda `CSP`/
  `X-Frame-Options`, aquela página específica está exposta a clickjacking/
  injeção mesmo que a API do mesmo site esteja perfeitamente configurada.
- Build passar, deploy "funcionar" e a página abrir normal não provam nada
  aqui — o navegador não avisa visualmente que um header de segurança está
  faltando numa rota específica.

## Checklist

- [ ] Liste todas as camadas que respondem no mesmo domínio público (API/
      app, proxy/estático servindo a SPA, CDN/edge se houver).
- [ ] Decida, por header, qual camada é a dona — não assuma que configurar
      numa cobre as outras. Pode ser a mesma config duplicada em cada
      camada, ou (melhor, quando possível) um único ponto na borda (CDN/
      proxy) que já intercepta toda resposta antes de sair pro navegador.
- [ ] Depois de configurar, confirme no fio, por rota real, não só na que
      você tocou:
      ```bash
      curl -sD - -o /dev/null https://seu-dominio.com/              # SPA/estático
      curl -sD - -o /dev/null https://seu-dominio.com/api/algo       # API
      ```
      Compare os headers de segurança entre as duas saídas — qualquer um
      presente numa e ausente na outra é a lacuna.
- [ ] Repita a checagem depois de qualquer mudança de infraestrutura que
      adicione uma camada nova na frente (CDN, novo proxy, novo serviço
      compartilhando o domínio) — a lacuna pode reaparecer sem que o
      código de nenhum lado tenha mudado.
- [ ] Para `Strict-Transport-Security` especificamente: garanta que a
      *primeira* resposta que um visitante pode receber de qualquer rota
      do domínio já manda o header — não só as rotas "principais". Um
      visitante cuja primeira requisição cai numa rota sem HSTS nunca
      ativa a proteção para aquela sessão.

## Generalização

A mesma lição já apareceu, com outro header, no caso de compressão
(`Content-Encoding`) e de negociação de cache (`Vary`) — proxy na frente
não herda automaticamente nada que o backend faz, e vice-versa. Trate
qualquer header de resposta como uma decisão por camada, nunca por
domínio: sempre que mais de um processo responde pelo mesmo host público,
audite cada um separadamente.
