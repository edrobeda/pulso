// Lições reais extraídas da operação dos agentes autônomos do Pulso,
// genericizadas (sem domínio, credencial ou nome de projeto específico)
// para servir como referência independente do nosso ambiente.
// `downloads` é sempre uma lista — mesmo quando só tem um arquivo — pra
// suportar lições/kits com múltiplos downloads sem precisar de dois
// formatos diferentes no componente que renderiza. `file` é o caminho
// relativo dentro de /downloads/ (pode incluir subpasta, ex. de versão).
export const lessons = [
  {
    slug: 'http-200-nao-e-validacao',
    title: '"HTTP 200" não prova que o deploy funciona',
    tag: 'deploy',
    problem:
      'Um erro de JavaScript na carga de um módulo (uma variável de template não escapada, por exemplo) ainda devolve o HTML/CSS inteiro com status 200 — o navegador só descobre ao executar o script. Como várias rotas compartilhavam o mesmo bundle, um erro numa página nova derrubou o site inteiro em tela branca, e a checagem automática (curl) não viu nada de errado.',
    lesson:
      '`curl` valida transporte, não execução. Depois de qualquer deploy automatizado, abra a página num browser headless de verdade e cheque erros de console/`pageerror` antes de considerar a rodada um sucesso.',
    downloads: [
      { file: 'post-deploy-smoke-test.md', label: 'Script de smoke test com Puppeteer' },
    ],
  },
  {
    slug: 'hooks-antes-do-early-return',
    title: 'Hooks do React precisam vir antes de qualquer return condicional',
    tag: 'frontend',
    problem:
      'Um hook chamado depois de um `return` condicional muda de ordem entre renderizações — o React quebra silenciosamente ou lança erro, dependendo do caso. Foi um bug recorrente em telas de jogo com múltiplos estados (carregando, erro, pronto).',
    lesson:
      'Todo `useState`/`useEffect`/`useMemo` sempre no topo do componente, nunca depois de um `if (...) return`. É fácil de esquecer e o bug só aparece em combinações específicas de estado.',
    downloads: [
      { file: 'react-hooks-checklist.md', label: 'Checklist de hooks + exemplos certo/errado' },
    ],
  },
  {
    slug: 'referencia-recriada-reseta-efeito',
    title: 'Array recriado a cada render reseta um efeito em loop',
    tag: 'frontend',
    problem:
      'Um array derivado de uma prop (`texto.split(",")`) era recalculado — nova referência — a cada renderização. Um `useEffect` que dependia dele disparava de novo toda vez, inclusive por causa do próprio efeito (uma animação de digitação), travando a animação no primeiro caractere em loop infinito.',
    lesson:
      'Memoize com `useMemo` qualquer array/objeto derivado que vá para o array de dependências de um `useEffect`. Dependa do valor primitivo real quando possível, não do array derivado dele.',
    downloads: [
      { file: 'react-hooks-checklist.md', label: 'Checklist de hooks + exemplos certo/errado' },
    ],
  },
  {
    slug: 'cron-utc-vs-fuso-local',
    title: 'Cron roda em UTC — timezone errado grava o dia errado',
    tag: 'infra',
    problem:
      'O servidor roda em UTC, mas os usuários pensam em horário de Brasília (UTC-3). `CURRENT_DATE` no Postgres seguia o timezone padrão do banco (UTC), então qualquer rodada entre 21h e meia-noite (horário local) gravava a data de amanhã para um evento que, pro usuário, aconteceu hoje à noite.',
    lesson:
      'Defina explicitamente o timezone do banco (`ALTER DATABASE ... SET timezone`) em vez de deixar implícito no timezone do SO do container, que normalmente é UTC por padrão em imagens Docker. Teste especificamente a janela de virada de dia.',
    downloads: [
      { file: 'db-timezone-setup.sql', label: 'Template SQL de configuração de timezone' },
    ],
  },
  {
    slug: 'flock-timeout-agente-preso',
    title: 'Sem lock nem timeout, um agente preso trava todas as rodadas seguintes',
    tag: 'infra',
    problem:
      'Um modelo de linguagem começou a travar indefinidamente numa chamada, sem erro nem resposta. Sem timeout, cada rodada consumia o tempo máximo configurado; sem lock, cada rodada seguinte do cron era pulada por achar que a anterior ainda estava rodando — o sistema ficou horas sem processar nada, sem nenhum container cair (só o agente preso).',
    lesson:
      'Todo job agendado com frequência alta precisa de `flock` (evita sobreposição) e `timeout` (evita que uma chamada travada consuma mais que o intervalo entre rodadas). Nenhum dos dois sozinho resolve — precisa dos dois juntos.',
    downloads: [
      { file: 'cron-agent-wrapper.sh', label: 'Template de wrapper com flock + timeout' },
    ],
  },
  {
    slug: 'git-dono-entre-usuarios',
    title: 'Dois usuários Linux no mesmo repositório geram "dubious ownership"',
    tag: 'infra',
    problem:
      'Um projeto roda sob um usuário de serviço dedicado, mas às vezes precisa de uma edição manual feita como root (debug, ajuste emergencial). Isso muda o dono dos arquivos tocados — e a próxima operação de git do usuário de serviço original passa a ser recusada pelo próprio git como proteção de segurança.',
    lesson:
      'Rode operações de git como o dono real do repositório (`sudo -u usuario-dono git ...`) em vez de como root, e devolva o dono correto (`chown`) depois de qualquer edição manual. Evite desligar a proteção globalmente (`safe.directory *`).',
    downloads: [
      { file: 'git-multi-user-notes.md', label: 'Notas + checklist de git multiusuário' },
    ],
  },
  {
    slug: 'anatomia-harness-agente-autonomo',
    title: 'Anatomia de um harness pra agente autônomo com escopo travado',
    tag: 'agentes',
    problem:
      'Rodar um agente sem revisão humana antes de agir só é seguro se o ambiente ao redor dele — não só o texto do prompt — limitar o dano possível: usuário de sistema dedicado, escopo de arquivos travado, critério de sucesso real (não só "o comando terminou"), canal formal pra escalar decisões que exigem um humano.',
    lesson:
      'O prompt diz o que fazer; o harness garante o que o agente não pode fazer mesmo se o prompt for mal interpretado. Projete o harness antes de escrever o prompt.',
    downloads: [
      { file: 'autonomous-agent-prompt-template.md', label: 'Esqueleto de prompt + checklist de harness' },
    ],
  },
  {
    slug: 'iabrain-v0-01',
    title: 'iaBrain v0.01 — orquestrador, subagentes, skills e memória',
    tag: 'agentes',
    problem:
      'Um sistema de agentes de IA sem separação clara de papéis tende a virar uma bagunça: um único prompt gigante tentando fazer roteamento, execução e memória ao mesmo tempo, contexto poluído por passos intermediários que ninguém precisava ver, e nenhum critério consistente pra decidir quando delegar uma tarefa ou quando registrar algo como memória permanente.',
    lesson:
      'Separar em quatro peças que se combinam sempre do mesmo jeito — um orquestrador que só ele fala com o usuário, subagentes de escopo estreito que rodam isolados, skills como documentos de referência (não agentes), e memória dividida em quatro categorias com regra própria de quando atualizar — resolve a bagunça estrutural. O que sobra de difícil (e é o que mais precisa de iteração) é o roteamento: quando escrever memória e quando delegar. Versionado (v0.01, v0.02...) de propósito, porque essa parte muda com o uso real. Tem um prompt de instalação/atualização automática: cole no seu agente e ele mesmo verifica a versão mais recente e baixa tudo.',
    downloads: [
      { file: 'iabrain/install-prompt.md', label: 'Prompt de instalação/atualização automática' },
      { file: 'iabrain/v0.01/README.md', label: 'README — visão geral + instalação por harness' },
      { file: 'iabrain/v0.01/orquestrador-prompt.md', label: 'Template de prompt do orquestrador' },
      { file: 'iabrain/v0.01/subagente-template.md', label: 'Template de definição de subagente' },
      { file: 'iabrain/v0.01/skill-template.md', label: 'Template de skill de referência' },
      { file: 'iabrain/v0.01/memoria-profile.md', label: 'Memória: profile' },
      { file: 'iabrain/v0.01/memoria-preferences.md', label: 'Memória: preferences' },
      { file: 'iabrain/v0.01/memoria-topics.md', label: 'Memória: topics' },
      { file: 'iabrain/v0.01/memoria-people.md', label: 'Memória: people' },
      { file: 'iabrain/v0.01/notas-de-design.md', label: 'Notas de design: quando gravar memória, quando delegar' },
    ],
  },
  {
    slug: 'mcp-builder-guia-geral',
    title: 'MCP Builder — autenticação com fallback de túnel',
    tag: 'mcp',
    problem:
      'Servidores MCP que autenticam com serviço de terceiro esbarram num problema recorrente: alguns provedores aceitam `localhost` como redirect URI (loopback simples resolve), mas provedores enterprise exigem HTTPS público — e não dá pra saber qual caso é até tentar, nem sempre compensa cadastrar um domínio fixo só pra um fluxo de login que roda raramente.',
    lesson:
      'Um fluxo de auth com fallback automático resolve sem exigir infraestrutura permanente: tenta o token salvo primeiro, cai pro loopback quando o provedor aceita, e só sobe um túnel Cloudflare efêmero (`cloudflared tunnel --url`, sem conta nem DNS) quando o provedor exige HTTPS público. Guia vivo — cresce conforme aparecem novos provedores/casos de autenticação.',
    downloads: [
      { file: 'mcp-builder.md', label: 'Guia geral de construção de servidores MCP' },
    ],
  },
]
