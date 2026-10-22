# Checklist: redigir antes de persistir, não só antes de exibir

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo, extraído e adaptado de um caso real para uso genérico.
> É um ponto de partida, não uma solução pronta — adapte e teste no seu
> próprio ambiente antes de confiar nele. O autor não se responsabiliza por
> qualquer dano, perda de dados ou mau funcionamento decorrente do uso
> deste conteúdo.

## O problema, em uma frase

Uma API passou a persistir seus próprios erros internos numa tabela,
pensando numa página de status pública que mostraria "últimos erros por
rota" — um padrão de observabilidade saudável (ver a lição "verificação
que só o processo vê" deste catálogo). O detalhe fácil de deixar passar:
a mensagem de erro, nessa altura, ainda carrega detalhe interno (IP de
origem da conexão, caminho de arquivo, nome de outro serviço) — e esse
detalhe só seria filtrado depois, na hora de montar a resposta da rota
pública que lê essa tabela. Entre o `INSERT` e o filtro ficaria uma janela
real em que o dado sensível já está gravado em texto puro — acessível a
qualquer consulta direta ao banco, a um `pg_dump`, a um admin futuro, ou a
um novo endpoint que leia a mesma tabela sem repetir o filtro.

## Por que redigir só na leitura não é suficiente

- **Existe só um caminho de escrita, mas podem existir vários de
  leitura** — o endpoint público de hoje, um painel administrativo de
  amanhã, uma query ad-hoc de depuração, um dump de backup restaurado em
  outro lugar pra investigação. Cada leitura nova precisaria lembrar de
  reaplicar o mesmo filtro; esquecer um não dá erro, só vaza.
- **O dado bruto nunca devia ter existido ali pra começar** — mesmo sem
  nenhuma leitura pública, qualquer pessoa com acesso de leitura ao banco
  (que não é a mesma permissão de quem pode alterar o código da rota
  pública) já vê o detalhe interno sem precisar de nenhum endpoint.
- **Redigir na escrita acontece uma vez só, redigir na leitura precisa
  acontecer certo em todo lugar, pra sempre.** É a mesma lição, de novo,
  por trás de "sanitizar input numa borda só" — centralizar o ponto único
  onde a garantia é aplicada é sempre mais barato que confiar que todo
  consumidor futuro vai lembrar de repetir a regra.

## O padrão que resolve

1. **Redija no momento de gravar**, não no momento de servir. O dado que
   entra na tabela já deveria estar seguro pra qualquer leitura futura,
   conhecida ou não.
2. **Trate a mensagem como dado de entrada não confiável**, mesmo vindo de
   dentro do seu próprio processo — ela foi formada a partir de contexto de
   requisição (IP, headers, query), então carrega o mesmo tipo de detalhe
   que você já trata com cuidado em qualquer log voltado a cliente externo.
3. **Mantenha uma lista pequena e explícita do que precisa sair** (IPv4,
   caminho absoluto de arquivo, hostname interno, nome de outro serviço
   compartilhado) em vez de uma blocklist implícita que cresce "quando
   alguém notar". Se a lista for curta e nomeada, revisá-la depois é
   possível; se for um `try { } catch { log genérico }` qualquer, não tem
   o que revisar.
4. **Ainda vale a pena filtrar de novo na leitura**, como defesa em
   profundidade — mas como camada extra, nunca como a única.

## Exemplo mínimo (Node/Express, mas o padrão vale pra qualquer stack)

```js
// Lista pequena e nomeada do que precisa sair antes de persistir
function redactSensitive(message) {
  return String(message)
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[ip]')       // IPv4
    .replace(/\/home\/[^/\s]+\/[^\s]*/g, '[path]')          // caminho absoluto
    .replace(/\b[\w-]+\.internal\b/gi, '[host-interno]')    // hostname interno
}

async function logServerError(route, err) {
  const safeMessage = redactSensitive(err.message)
  // Grava só a versão já redigida — nunca err.message cru.
  await pool.query(
    'INSERT INTO server_errors (route, message, occurred_at) VALUES ($1, $2, now())',
    [route, safeMessage]
  )
}
```

## Checklist rápido pra aplicar num log/observability já existente

- [ ] Toda escrita numa tabela que alimenta (hoje ou no futuro) uma
      superfície pública passa por uma função de redação explícita antes
      do `INSERT`/`UPDATE` — não depois, na hora de servir.
- [ ] A lista do que é redigido é pequena, nomeada e versionada no código
      (não um filtro genérico tipo "remove tudo que parecer sensível"),
      pra dar pra revisar e estender de propósito.
- [ ] Quem tem acesso de leitura direta ao banco (DBA, backup, ambiente de
      staging restaurado) não vê nada que o endpoint público também não
      mostraria — teste isso com uma query direta, não só pelo endpoint.
- [ ] Mesmo redigindo na escrita, a rota pública que lê esses dados ainda
      aplica seu próprio filtro de exposição (nome de coluna, campos que
      nunca deveriam sair) como segunda camada, não como a única.
- [ ] Mudança de escopo testada: forçar um erro real com detalhe sensível
      no texto (ex. derrubar a conexão de um IP específico) e confirmar
      que a linha gravada na tabela já chega redigida, sem precisar da
      camada de leitura pra esconder nada.
