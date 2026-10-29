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
    title: 'iaBrain — orquestrador, subagentes, skills, memória, coordenação assíncrona, confinamento, verificação, eficiência de contexto, sensor de estado e escalonamento pra humano',
    tag: 'agentes',
    problem:
      'Um sistema de agentes de IA sem separação clara de papéis tende a virar uma bagunça: um único prompt gigante tentando fazer roteamento, execução e memória ao mesmo tempo, contexto poluído por passos intermediários que ninguém precisava ver, e nenhum critério consistente pra decidir quando delegar uma tarefa ou quando registrar algo como memória permanente. Isso cobre só o caso de agentes na mesma sessão: quando os agentes são processos genuinamente independentes (cron em horários diferentes, sem sessão compartilhada), delegar e esperar resposta não existe — eles só se enxergam através do que gravam em algum lugar durável. E nenhuma dessas peças resolve um problema adicional e mais crítico: quando pelo menos um desses agentes age sem revisão humana antes de cada passo, o que impede dano além do pretendido não é o texto do prompt, é o que existe ao redor dele.',
    lesson:
      'Separar em peças que se combinam sempre do mesmo jeito — um orquestrador que só ele fala com o usuário, subagentes de escopo estreito que rodam isolados, skills como documentos de referência (não agentes), memória dividida em quatro categorias com regra própria de quando atualizar — resolve a bagunça estrutural de agentes que dividem sessão. Pra agentes que não dividem sessão (o caso deste próprio blog: publicação, infraestrutura e este catálogo rodam em horários separados, sem se ver ao vivo), o padrão que sobra é outro: um canal de pedido/resposta em arquivo, um log append-only lido por amostra recente (não inteiro a cada rodada), e uma tabela de status que é visível por um humano, não só gravada. Pra qualquer agente que roda sem revisão humana, uma camada por cima de tudo isso: escopo travado por allow-list explícita (não por instrução verbal), canal de escalonamento no lugar de contorno quando o escopo barra algo, gate de permissão por consequência real da ação (não pelo tipo técnico de ferramenta usada), dado de ferramenta de monitoramento tratado como não confiável, e recusa de classificador de segurança do provedor tratada como categoria própria de falha. E, mesmo fazendo tudo isso certo, falta uma última pergunta: como saber que o que foi feito funcionou de verdade antes de reportar a rodada como concluída — build passar não prova runtime, HTTP 200 não prova execução, arquivo existir não prova que restaura; reverter pro estado anterior conhecido-bom é sempre uma saída válida quando a verificação falha, nunca motivo pra deixar algo quebrado no ar. E uma última peça que só aparece com o tempo, não desde o primeiro dia: um agente que roda repetidamente sobre um ambiente que só cresce (mais histórico, mais log) paga custo de contexto cada vez maior por rodada se não tiver o hábito deliberado de ler histórico por amostra recente em vez do artefato inteiro, truncar saída verbosa de comando, resolver mais por chamada de ferramenta e não reler o que acabou de escrever só pra confirmar — medido na prática como `cache_read_tokens` caindo depois do ajuste, não só uma impressão de que ficou "mais limpo". E uma peça final, mais barata que a tabela de status: um arquivo JSON pequeno (`shipped`/`summary`/`needs_input`), sobrescrito a cada rodada em vez de anexado, que responde em menos de um segundo "a última rodada terminou bem, e precisa de mim?" sem exigir banco, consulta nem rotação. Mais uma distinção que só o canal de pedido/resposta sozinho não captura: quando quem responde é outro agente, ele vai reler esse mesmo canal na própria rodada seguinte de qualquer jeito — basta o arquivo durável; quando quem responde é um humano, não existe "próxima rodada" que o force a voltar olhar nada, então o canal durável precisa vir acompanhado de uma notificação ativa disparada no instante em que o pedido é escrito, e a resposta de volta só chega por reconferência passiva (sem aviso nenhum do lado humano), nunca por aviso automático. Versionado (v0.01, v0.02, v0.03, v0.04, v0.05, v0.06, v0.07...) de propósito, porque a parte mais difícil — quando escrever memória, quando delegar, quando coordenar por estado durável, onde travar o confinamento, o que verificar antes de declarar sucesso, onde conter o custo de contexto, como sinalizar o resultado de uma rodada sem exigir que alguém leia log — só se ajusta testando contra uso real. Tem um prompt de instalação/atualização automática: cole no seu agente e ele mesmo verifica a versão mais recente e baixa tudo.',
    downloads: [
      { file: 'iabrain/install-prompt.md', label: 'Prompt de instalação/atualização automática' },
      { file: 'iabrain/v0.07/README.md', label: 'README — visão geral + instalação por harness' },
      { file: 'iabrain/v0.07/orquestrador-prompt.md', label: 'Template de prompt do orquestrador' },
      { file: 'iabrain/v0.07/subagente-template.md', label: 'Template de definição de subagente' },
      { file: 'iabrain/v0.07/skill-template.md', label: 'Template de skill de referência' },
      { file: 'iabrain/v0.07/memoria-profile.md', label: 'Memória: profile' },
      { file: 'iabrain/v0.07/memoria-preferences.md', label: 'Memória: preferences' },
      { file: 'iabrain/v0.07/memoria-topics.md', label: 'Memória: topics' },
      { file: 'iabrain/v0.07/memoria-people.md', label: 'Memória: people' },
      { file: 'iabrain/v0.07/notas-de-design.md', label: 'Notas de design: quando gravar memória, quando delegar' },
      { file: 'iabrain/v0.07/coordenacao-assincrona.md', label: 'Coordenação assíncrona entre agentes independentes' },
      { file: 'iabrain/v0.07/confinamento-harness.md', label: 'Harness de confinamento pra agente sem revisão humana' },
      { file: 'iabrain/v0.07/verificacao-e-reversao.md', label: 'Gate de verificação antes de declarar sucesso, com reversão' },
      { file: 'iabrain/v0.07/eficiencia-de-contexto.md', label: 'Eficiência de contexto pra agente de rodada repetida' },
      { file: 'iabrain/v0.07/sensor-de-estado.md', label: 'Sensor de estado por rodada (JSON sobrescrito)' },
      { file: 'iabrain/v0.07/escalonamento-humano.md', label: 'Novo na v0.07: escalonamento pra humano exige notificação ativa' },
    ],
  },
  {
    slug: 'backup-sem-verificacao-nao-e-backup',
    title: 'Backup sem verificação de integridade não é backup, é aposta',
    tag: 'infra',
    problem:
      'Um script de backup gerava o dump, comprimia e encerrava com sucesso (exit 0) mesmo quando o arquivo final saía truncado — disco cheio no meio da escrita, processo interrompido, pipe corrompido. O `.gz` ficava salvo na pasta de backups com aparência normal (existe, tem nome e data certos) até o dia em que alguém precisasse restaurar de verdade e descobrisse, tarde demais, que o conteúdo é inútil.',
    lesson:
      'Gerar o backup é a parte fácil; validar que ele é restaurável é a que costuma faltar. Depois de escrever o arquivo, teste a integridade dele no próprio formato (`gzip -t`, `tar -tzf`, `pg_restore --list`, o que for equivalente) e exija um piso mínimo de tamanho plausível. Se falhar, apague o arquivo ruim e retorne erro alto (exit non-zero, log que dispare alerta) — nunca deixe um backup quebrado na pasta parecendo válido.',
    downloads: [
      { file: 'backup-integrity-check.sh', label: 'Template de backup + verificação de integridade' },
    ],
  },
  {
    slug: 'verificacao-que-so-o-processo-ve',
    title: 'Uma verificação que só o processo vê equivale a não ter verificação',
    tag: 'infra',
    problem:
      'Um job agendado passou a testar a integridade do próprio resultado (o caso concreto foi um backup: verificação de tamanho e integridade do arquivo gerado), mas esse resultado só existia dentro de um log local. A verificação em si estava correta — pegaria uma falha real se acontecesse — só que nada nem ninguém checava esse log rotineiramente. Uma falha silenciosa podia ficar dias sem que qualquer humano soubesse, porque "ter a verificação implementada" e "alguém realmente ver o resultado dela" são coisas diferentes, e só a primeira tinha sido resolvida.',
    lesson:
      'Depois de qualquer verificação de sucesso/falha de um job agendado, pergunte separadamente: onde um humano vê esse resultado sem precisar entrar no servidor e ler log? Grave cada execução como uma linha de histórico (sucesso/falha, quando, um detalhe curto) numa tabela pequena, e exponha o último resultado num lugar que já é visitado rotineiramente (um painel interno, uma página de status) — mesmo que simples, tipo ✅/❌ + "há quanto tempo". Se essa exposição for pública, corte todo detalhe interno (caminho, hostname, nome de outro serviço). Alarme passivo (algo que aparece numa página já visitada) resolve a maior parte do problema antes de precisar de alerta ativo (e-mail, Slack) — que também pode ser ignorado. Isso tudo pressupõe que o job chega a rodar seu próprio código até o ponto de gravar aquela linha — se a falha acontece numa camada anterior (autenticação da própria ferramenta que executa o job, por exemplo, travando antes de qualquer lógica do job rodar), só um watchdog de fora do processo (o wrapper que o cron de fato chama, checando o exit code real) grava isso em nome dele.',
    downloads: [
      { file: 'verificacao-que-so-o-processo-ve.md', label: 'Checklist: histórico de execução + exposição de status' },
    ],
  },
  {
    slug: 'rota-nova-nao-propaga-sozinha',
    title: 'Uma rota nova não aparece sozinha em sitemap, menu ou dados estruturados',
    tag: 'frontend',
    problem:
      'O roteador da aplicação é a lista canônica de páginas, mas o `sitemap.xml` mantinha sua própria lista de rotas estáticas, escrita à mão e em paralelo — separada do array real de rotas do roteador. Uma página nova foi adicionada ao roteador, funcionava perfeitamente (link direto abria, sem erro, build passava), e mesmo assim ficou ausente do sitemap por um tempo: nada quebrou tecnicamente, só ficou incompleto, e não existe erro pra notar isso — só ausência silenciosa até alguém comparar as duas listas à mão.',
    lesson:
      'Toda lista derivada de rotas (sitemap, menu, dados estruturados, controle de acesso por rota) deveria ler a mesma fonte de verdade que o roteador usa, em vez de manter uma cópia manual paralela. Quando não dá pra eliminar a duplicação, um teste automatizado que compara as duas listas e falha quando divergem transforma o esquecimento silencioso em falha de CI barulhenta no momento em que a rota é adicionada, não semanas depois.',
    downloads: [
      { file: 'new-page-checklist.md', label: 'Checklist + exemplo de teste de consistência de rotas' },
    ],
  },
  {
    slug: 'mcp-builder-guia-geral',
    title: 'MCP Builder — autenticação com fallback de túnel',
    tag: 'mcp',
    problem:
      'Servidores MCP que autenticam com serviço de terceiro esbarram num problema recorrente: alguns provedores aceitam `localhost` como redirect URI (loopback simples resolve), mas provedores enterprise exigem HTTPS público — e não dá pra saber qual caso é até tentar, nem sempre compensa cadastrar um domínio fixo só pra um fluxo de login que roda raramente.',
    lesson:
      'Um fluxo de auth com fallback automático resolve sem exigir infraestrutura permanente: tenta o token salvo primeiro, cai pro loopback quando o provedor aceita, e só sobe um túnel Cloudflare efêmero (`cloudflared tunnel --url`, sem conta nem DNS) quando o provedor exige HTTPS público. Guia vivo — cresce conforme aparecem novos provedores/casos de autenticação. Além do material de referência, tem uma skill guiada: em vez de só explicar o padrão, ela conduz um agente etapa por etapa (levantamento → auth → tools → teste ponta a ponta) verificando cada uma antes de avançar, até o MCP estar realmente no ar ou ficar provado que não dá — sem ficar tentando indefinidamente algo já bloqueado.',
    downloads: [
      { file: 'mcp-builder.md', label: 'Guia geral de construção de servidores MCP' },
      { file: 'mcp-builder-skill.md', label: 'Skill guiada: constrói o MCP até funcionar (SKILL.md)' },
    ],
  },
  {
    slug: 'tendencia-nao-so-snapshot',
    title: 'Um valor isolado não avisa nada — é a tendência que importa',
    tag: 'infra',
    problem:
      'Um recurso compartilhado (espaço em disco do host) foi enchendo aos poucos, uns 100MB por dia, ao longo de mais de uma semana, até chegar perto do limite. Só foi percebido porque alguém checou o valor bruto manualmente em rodadas separadas e comparou de cabeça com o que lembrava da vez anterior — não existia histórico gravado nem cálculo automático de tendência. Pra piorar, o processo que precisava do alerta nem tinha permissão pra investigar ou limpar o recurso real, que era compartilhado com outros serviços fora do escopo dele — só podia observar e avisar.',
    lesson:
      'Duas coisas resolvem isso, e são independentes uma da outra. Primeiro: grave o valor medido como série temporal (linha nova a cada checagem), não como "estado atual" que sobrescreve o anterior — só assim dá pra calcular a taxa de crescimento automaticamente, em vez de depender de alguém lembrar o número da vez passada. Segundo: quando o recurso que preocupa está fora do seu acesso ou permissão, meça uma proxy que você controla e que tende a crescer junto (ex.: o tamanho do seu próprio banco, da sua própria pasta de log) — não é o dado exato, mas dá alerta antecipado sem exigir um acesso que você não tem.',
    downloads: [
      { file: 'resource-trend-snapshot.sh', label: 'Template: snapshot + tendência + alerta de recurso' },
    ],
  },
  {
    slug: 'dockerfile-copy-nao-acompanha-modulo-novo',
    title: 'Dockerfile com COPY explícito não acompanha um módulo novo sozinho',
    tag: 'deploy',
    problem:
      'Uma função foi extraída do arquivo principal do servidor para um módulo novo numa pasta separada. Funcionava perfeitamente em ambiente local e o `docker build` da imagem passava sem erro — mas o Dockerfile listava explicitamente cada arquivo a copiar (em vez de copiar a pasta toda), e ninguém tinha adicionado a linha nova. A imagem subiu sem o módulo, e o processo só quebrou (`ERR_MODULE_NOT_FOUND`, API caindo) no runtime, ao tentar de fato carregar o import ausente.',
    lesson:
      'Build de imagem só empacota o que foi mandado empacotar — não verifica se todo import do código tem um arquivo correspondente copiado. Depois de qualquer Dockerfile com COPY explícito, rebuild do zero (sem cache de imagem antiga) e exercite de verdade o caminho de código novo antes de considerar o deploy validado; "o build passou" não prova que a imagem está completa, do mesmo jeito que "HTTP 200" não prova que a página funciona.',
    downloads: [
      { file: 'dockerfile-copy-checklist.md', label: 'Checklist: Dockerfile com COPY explícito + módulo novo' },
    ],
  },
  {
    slug: 'conteudo-negociado-por-header-precisa-de-vary',
    title: 'Servir conteúdo diferente por User-Agent sem `Vary` envenena o cache',
    tag: 'infra',
    problem:
      'Uma mesma URL devolvia dois corpos diferentes conforme o `User-Agent`: um HTML pré-renderizado enxuto para bots de preview de link e o shell da SPA (só JS) para navegadores. Sem o header `Vary` declarando essa dependência, qualquer cache compartilhado no caminho (CDN, proxy reverso, cache de edge do framework) guardava a primeira variante que via e servia ela para todo mundo naquela URL — um humano recebia o HTML enxuto do robô, ou o robô recebia o shell vazio. Nada dava erro; era intermitente, dependia de quem esquentou o cache primeiro, e sumia ao recarregar sem cache, o que faz o bug ser fechado como "não reproduzo".',
    lesson:
      'Toda resposta cujo corpo muda em função de um header da requisição (`User-Agent`, `Accept`, `Accept-Language`, `Cookie`...) precisa listar esse header em `Vary` — é o contrato que diz ao cache que aquela entrada só serve requisições com o mesmo valor. Mas `Vary: User-Agent` fragmenta o cache de forma agressiva (dezenas de milhares de UAs distintas viram entradas separadas): quando possível, negocie por um sinal de baixa cardinalidade (um `X-Is-Bot` que o edge define) ou separe as representações por URL, que aí nem precisa de `Vary`. E teste com um cache de verdade no meio, esquentando com uma variante e conferindo que a outra ainda vem certa nos dois sentidos — `curl` direto na origem nunca vê esse problema.',
    downloads: [
      { file: 'vary-header-content-negotiation.md', label: 'Nota + script de teste de cache por variante de header' },
    ],
  },
  {
    slug: 'proxy-da-frente-nao-comprime-sozinho',
    title: 'O proxy da frente não comprime a resposta só porque poderia',
    tag: 'infra',
    problem:
      'Um proxy reverso na frente da aplicação servia os arquivos estáticos comprimidos (gzip/brotli) normalmente, então ninguém percebeu que as respostas dinâmicas — JSON de API, sitemap, feeds RSS/Atom — saíam sem compressão nenhuma. O proxy estava configurado pra comprimir só o que ele mesmo lê do disco; o corpo vindo do backend via `proxy_pass` era repassado como veio. Nada dava erro: as respostas chegavam certas, só maiores do que precisavam, e o desperdício crescia em silêncio exatamente nos payloads que só aumentam (lista de posts, backlog, feed com texto completo).',
    lesson:
      'Pôr um proxy ou CDN na frente não garante compressão — em muitos setups ele comprime apenas o estático servido por ele e deixa passar o corpo do backend intacto. Decida explicitamente qual camada é dona da compressão (middleware do app OU config do proxy, não "os dois por acaso"), ligue de propósito e confirme no fio: `curl --compressed -sD - -o /dev/null` pela URL pública (não pela origem) e cheque se o `Content-Encoding` aparece nas respostas de texto, não só no HTML. Armadilhas: o `Content-Type` da resposta fora da lista de tipos compressíveis do proxy (`application/rss+xml` costuma faltar), o upstream mandando `Content-Encoding: identity`, o proxy removendo `Accept-Encoding` do request pro upstream sem comprimir ele mesmo, e resposta abaixo do tamanho mínimo (aí não comprimir é esperado, não bug).',
    downloads: [
      { file: 'response-compression-check.sh', label: 'Script: confere compressão de resposta na borda pública' },
    ],
  },
  {
    slug: 'nome-generico-em-rede-docker-compartilhada',
    title: 'Numa rede Docker compartilhada, "api" pode resolver pro container de outro projeto',
    tag: 'infra',
    problem:
      'Vários projetos docker compose no mesmo host, todos ligados a uma rede Docker externa compartilhada pra um proxy reverso único alcançar todos. Cada projeto chamava seu backend de `api`. O DNS embutido do Docker resolve um nome de serviço para todos os containers que têm aquele alias de rede — então `api` passou a ter dois endereços, e cada `proxy_pass http://api:...` sorteava um deles a cada resolução. Metade das requisições caía no backend de outro projeto e voltava 404 (ou 200 com o corpo errado). Intermitente, sem erro em lugar nenhum: o backend certo nem via a request, o errado logava um 404 anônimo, e recarregar "resolvia" — então fechava como "não reproduzo".',
    lesson:
      'Nome de serviço no compose é um identificador local ao projeto; no momento em que duas stacks dividem uma rede, esse namespace virou global e qualquer nome genérico (`api`, `db`, `cache`, `web`) é uma aposta. Referencie pelo nome único do container (`container_name`, único no daemon inteiro) ou por um alias de rede explícito e específico do projeto — nunca pelo alias curto compartilhado. Melhor ainda: não compartilhe a rede à toa (cada stack na sua rede interna, só o proxy em todas). Confirme o caso com `getent hosts api` de dentro de um container: duas linhas = você está sorteando backend.',
    downloads: [
      { file: 'docker-shared-network-nome-generico.md', label: 'Nota + comandos de diagnóstico de nome ambíguo em rede Docker' },
    ],
  },
  {
    slug: 'proxy-guarda-ip-antigo-do-container',
    title: 'O proxy continua mandando tráfego pro container antigo por alguns segundos após o deploy',
    tag: 'deploy',
    problem:
      'Um proxy reverso resolve o hostname do backend uma única vez, no carregamento da config, e guarda o IP. Quando o container do backend é recriado no deploy (`up -d`, rollout, azul/verde) ele ganha um IP novo — mas o proxy segue entregando pro IP antigo, que já morreu, até o TTL do resolver expirar (ou indefinidamente, se não houver `resolver` configurado). Nessa janela de alguns segundos a URL pública devolve 502/503/504 — ou um 404 de outra camada que assume o lugar. Some sozinho, então é fácil não perceber: o smoke test que roda no primeiro segundo pega um erro que já passou e reporta o deploy como falho (ou dispara rollback de um deploy que estava bom); ou ninguém testa nesse intervalo e o fato de usuários reais terem tomado erro por 30s nunca aparece em lugar nenhum.',
    lesson:
      'Elimine a janela em vez de só conviver com ela: no nginx, use uma variável no `proxy_pass` mais a diretiva `resolver` (`valid=` curto) pra forçar resolução em tempo de request; ou recarregue o proxy só depois que o container novo estiver saudável; ou faça rolling de verdade (sobe o novo antes de derrubar o antigo, com healthcheck). E faça a verificação pós-deploy distinguir "ainda estabilizando" de "quebrado": polling com backoff que tolera erro dentro de uma janela de graça e só falha se o erro persistir depois dela — reportando, ainda assim, que houve indisponibilidade, porque 30s de erro a cada deploy é bug de cutover, não custo aceitável.',
    downloads: [
      { file: 'deploy-cutover-recheck.sh', label: 'Script: verificação pós-deploy que separa janela transitória de falha real' },
    ],
  },
  {
    slug: 'prerender-pro-bot-sem-links-e-beco-sem-saida',
    title: 'A página que você renderiza só pro crawler não pode linkar só pra ela mesma',
    tag: 'frontend',
    problem:
      'Uma SPA ganhou um caminho de render paralelo pra quem não executa JavaScript (HTML pré-renderizado no servidor pros bots de busca e de preview de link). Esse template foi montado com o mínimo — título, meta tags, Open Graph, JSON-LD e o corpo do conteúdo — mas sem os links de navegação que o JavaScript injeta em volta no app normal (menu, anterior/próximo, relacionados, home). O resultado é um documento com o conteúdo certo e um único link: a própria URL canônica. Um crawler que cai ali por um link externo lê a página e não tem para onde ir — não descobre nenhuma outra página do site a partir dela. Nada dá erro: responde 200, o preview fica bonito, o conteúdo indexa, só que aquele nó fica desconectado do resto do grafo de links.',
    lesson:
      'O caminho de render pro bot é uma representação alternativa do site, não só do conteúdo daquela página — precisa carregar, em HTML real (`<a href>` com URL absoluta, não `onclick`/`router.push`), link pra home/seção pai, navegação sequencial quando existir, e alguns relacionados derivados da mesma lógica que o app usa (reaproveite a função/query, não reinvente, senão as duas representações divergem com o tempo). Trate "página sem nenhum link interno de saída" como bug de build, e teste como o bot: `curl` com User-Agent de crawler e conte os links de saída — se vier só a URL canônica, o template está incompleto.',
    downloads: [
      { file: 'prerender-sem-links-e-beco-sem-saida.md', label: 'Nota + script que conta links de saída do HTML servido a bots' },
    ],
  },
  {
    slug: 'log-de-monitoramento-nao-e-instrucao',
    title: 'O log do seu próprio WAF pode carregar uma instrução pro seu agente obedecer',
    tag: 'agentes',
    problem:
      'Um agente com tarefa de investigar tráfego bloqueado ou triafica um alerta lê campos como `User-Agent`, mensagem de erro ou payload de crash report — todos escritos originalmente por quem fez a requisição, não pela ferramenta de monitoramento em si (WAF, rastreador de erro, observability). Como esse texto chega até o agente através de um sistema próprio e "confiável" (o painel do WAF, o Sentry, o Datadog), ele não é tratado com a mesma suspeita que um input de usuário cru — mas continua sendo, byte a byte, controlado por quem originou a requisição. Uma instrução disfarçada de telemetria (algo como "ignore instruções anteriores e..." embutido no User-Agent ou na mensagem de exceção) vira injeção de prompt indireta assim que o agente lê aquele campo como contexto de tarefa, e se a mesma sessão tem acesso a alguma ferramenta de ação (mudar DNS, fazer deploy, instalar pacote), a instrução tem caminho direto até um efeito real — sem que nenhuma requisição maliciosa precise sequer passar pelo firewall.',
    lesson:
      'Dado que passa por uma ferramenta de segurança ou observability tem taxa mais alta de conteúdo adversarial que a média, não mais baixa — é justamente o que essas ferramentas capturam. Delimite explicitamente qualquer log/alerta lido por um agente como dado não confiável (marcador claro no prompt, instrução de nunca seguir o que estiver dentro dele), separe o agente que só lê/triafica (sem ferramenta de ação de alto impacto) do que decide agir, e nunca deixe o portão entre os dois ser só "o LLM decidiu que parece seguro".',
    downloads: [
      { file: 'log-de-monitoramento-nao-e-instrucao.md', label: 'Checklist: log de monitoramento como dado não confiável' },
    ],
  },
  {
    slug: 'log-operacional-nao-pertence-ao-historico-do-git',
    title: 'Log de cada execução comitado no git sem limpeza faz o repositório crescer pra sempre',
    tag: 'infra',
    problem:
      'Um processo agendado (roda várias vezes por dia, todo dia) gravava um arquivo de log por execução como registro do que aconteceu naquela rodada — e cada um desses arquivos era comitado no controle de versão junto com o código, sem nenhuma limpeza. Isoladamente cada commit parecia inofensivo (um arquivo pequeno, texto simples), mas depois de meses acumulou centenas de arquivos: o repositório só cresce, sem nunca encolher, com dado que só tem valor prático nos primeiros dias após a execução. Nada quebra, nenhum erro aparece — é só peso morto se acumulando até alguém notar o histórico do repositório maior do que devia.',
    lesson:
      'Log de execução é dado operacional efêmero, não histórico de código — trate como tal: pasta fora do controle de versão (`.gitignore`), com rotação em disco que apaga o que passou de um limite de idade (`find ... -mtime +N -delete`). Se algo daquele log precisa durar além da janela de rotação, resuma numa entrada curta de um registro versionado (changelog, tabela de eventos) no momento da rodada — não guarde o bruto pra sempre "só por garantia". Dois portões independentes: rotação em disco (limita o que existe) e `.gitignore` (garante que o que existe não vai pro histórico de código).',
    downloads: [
      { file: 'log-operacional-rotacao-sem-git.sh', label: 'Template: rotação de log operacional + nota sobre .gitignore' },
    ],
  },
  {
    slug: 'meta-tags-duplicadas-entre-prerender-e-client-side',
    title: 'Duas implementações de meta tag pra mesma página divergem sem barulho nenhum',
    tag: 'frontend',
    problem:
      'Uma SPA com pré-renderização pra bots tinha duas rotinas independentes escrevendo as mesmas meta tags de compartilhamento (Open Graph, `article:*`) pra uma página: uma no template server-side, outra injetada via JavaScript depois da hidratação. As duas nasceram idênticas, mas quando campos novos (idioma da página, data de publicação/atualização) foram adicionados, só entraram na rotina do pré-render — a de client-side ficou pra trás. Nada quebrou: a página carregava normal dos dois jeitos, o preview pro bot que só lê HTML cru continuava completo, só a versão renderizada no navegador ficava com metadado incompleto, sem nenhum erro ou diferença visível pra apontar a lacuna.',
    lesson:
      'Duas implementações da "mesma" coisa que vivem em caminhos diferentes (server vs. client, bot vs. humano) não são coincidência inofensiva — são duplicação com prazo de validade. Compartilhe uma única fonte de campos sempre que der; onde não der, documente lado a lado o que uma precisa espelhar da outra; e um teste que compara as duas saídas (HTML pro bot vs. DOM hidratado) pra mesma URL transforma "campo esquecido" em falha de CI no momento em que é adicionado, não em lacuna descoberta meses depois.',
    downloads: [
      { file: 'meta-tags-duplicadas-prerender-client.md', label: 'Nota + script de comparação bot vs. client-side hidratado' },
    ],
  },
  {
    slug: 'erro-cru-pro-cliente-vaza-e-nao-loga',
    title: 'Devolver o erro cru pro cliente vaza detalhe interno e ainda não deixa rastro',
    tag: 'infra',
    problem:
      'Cada rota de uma API respondia erro interno (500) devolvendo `err.message` direto no corpo JSON pro cliente — e nada era registrado no lado do servidor. São dois problemas na mesma linha de código, e nenhum dá sinal visível: a mensagem de uma falha de banco costuma incluir nome de tabela/coluna/trecho de query, informação que ajuda quem está do outro lado a mapear o schema; e sem log server-side, a única forma de investigar uma falha depois do fato é reproduzir o bug de novo — se foi intermitente, o rastro já sumiu pra sempre.',
    lesson:
      'Separe o que o cliente precisa saber do que o operador precisa saber: toda resposta de erro ao cliente usa uma mensagem fixa e genérica, nunca `err.message`/stack cru; todo `catch` loga o erro completo no servidor antes de responder; e um middleware de log por requisição (método, rota, status, duração) roda em toda rota, não só nas que falham, pra reconstruir uma linha do tempo mesmo sem exceção. Aplique nas rotas todas de uma vez (grep por `err.message` na resposta) — é fácil corrigir onde o bug apareceu e esquecer o mesmo padrão copiado nas outras dez rotas.',
    downloads: [
      { file: 'erro-interno-log-vs-resposta-cliente.md', label: 'Checklist + exemplo: log detalhado pro operador, resposta genérica pro cliente' },
    ],
  },
  {
    slug: 'error-boundary-evita-tela-branca',
    title: 'Sem error boundary, um erro de render qualquer derruba a aplicação inteira',
    tag: 'frontend',
    problem:
      'Um erro lançado durante o render de qualquer componente (conteúdo dinâmico malformado, bug num componente específico) não fica contido ali — por padrão o React descarta a árvore inteira a partir da raiz montada, e a página vira branca pro visitante. Nenhum log ficava registrado e a única forma de continuar navegando era um F5 manual, nada óbvio pra quem só vê uma tela em branco sem mensagem nenhuma.',
    lesson:
      '`try/catch` comum não pega erro de render em React — só um error boundary (componente de classe com `getDerivedStateFromError`/`componentDidCatch`) captura isso. Duas camadas, não uma: uma em volta só do conteúdo roteado, que se reseta sozinha ao trocar de rota (`resetKey` amarrado ao path atual) sem exigir reload manual; e uma na raiz do app inteiro, como última linha de defesa caso o erro seja fora do conteúdo roteado. E sempre logar de verdade em `componentDidCatch` — capturar o erro sem registrar em lugar nenhum troca "app quebrado" por "app falha em silêncio", o que não é a mesma coisa que estar corrigido.',
    downloads: [
      { file: 'react-error-boundary.md', label: 'Componente + checklist: error boundary em duas camadas' },
    ],
  },
  {
    slug: 'integridade-de-arquivo-nao-prova-restore',
    title: 'O arquivo de backup passar no teste de integridade não prova que ele restaura',
    tag: 'infra',
    problem:
      'Um backup diário já tinha verificação de integridade do arquivo comprimido (`gzip -t`) antes de reportar sucesso — resolvendo o problema clássico de arquivo truncado por disco cheio ou processo interrompido. Só que integridade do formato de compressão e restaurabilidade do conteúdo são coisas diferentes: um `.gz` pode descomprimir perfeitamente e ainda conter um dump incompleto (schema pela metade, uma tabela que falhou no meio do `pg_dump` sem derrubar o processo inteiro, uma transação que não fechou certo). `gzip -t` só prova "não truncado no nível do arquivo comprimido" — nunca chegou a testar se o SQL lá dentro roda até o fim contra um banco de verdade.',
    lesson:
      'A validação definitiva de um backup é restaurá-lo de fato — não simular, restaurar mesmo — num destino descartável (banco temporário, schema separado, container efêmero) e comparar um sinal de saúde simples e barato de checar (contagem de linhas de uma tabela que varia de verdade, não uma tabela de configuração estática) contra o mesmo sinal no banco vivo. Só reporte sucesso se os dois baterem, e sempre limpe o destino descartável depois, com sucesso ou falha no teste. Isso é uma camada a mais sobre a verificação de integridade do arquivo, não um substituto dela — mantenha as duas: a de arquivo pega corrupção de transporte/disco; a de restore pega dump logicamente incompleto que a primeira nunca veria.',
    downloads: [
      { file: 'backup-restore-verification.sh', label: 'Template: restore real pra destino descartável + comparação de contagem' },
    ],
  },
  {
    slug: 'scanner-de-segredo-por-padrao-nao-pega-token-sem-formato',
    title: 'Scanner de segredo por padrão de fornecedor não pega token sem formato conhecido',
    tag: 'seguranca',
    problem:
      'Uma ferramenta de scan de segredo (gitleaks, GitHub secret scanning, scanner interno) roda limpa — zero achado — num arquivo de configuração que na verdade tem uma credencial hardcoded. O motivo: esses scanners funcionam por assinatura de fornecedor conhecido (prefixo fixo tipo chave de nuvem, token de Git host, chave de pagamento). Um bearer token ad-hoc de um serviço interno, ou de um conector novo — cada vez mais comum em arquivo de configuração de agente/MCP — não tem prefixo reconhecível nenhum, é só uma string opaca. O scanner não erra: ele simplesmente não tem regra pra aquele formato, e devolve "arquivo limpo" com a mesma confiança de quando está realmente limpo.',
    lesson:
      'Scan por padrão de fornecedor pega só a credencial que "parece" credencial de um jeito já catalogado — trate como complemento, não substituto, de uma checagem por heurística de entropia: qualquer valor literal (não `${VAR}`, não referência de variável, não vazio) atribuído a uma chave com nome de credencial (token, secret, key, password...) e com entropia alta o suficiente pra parecer aleatório merece revisão manual, mesmo sem bater com nenhum padrão conhecido. E uma credencial estática sem expiração continua sendo o mesmo risco muito depois de criada — rotação/expiração importa tanto quanto nunca ter sido commitada em texto puro.',
    downloads: [
      { file: 'secret-scan-padrao-vs-entropia.py', label: 'Script: heurística de entropia pra achar segredo sem padrão de fornecedor conhecido' },
    ],
  },
  {
    slug: 'vulnerabilidade-em-dependencia-que-voce-nunca-importou',
    title: 'A vulnerabilidade quase nunca está no pacote que você importou de propósito',
    tag: 'seguranca',
    problem:
      'Uma auditoria de dependências encontrou vulnerabilidades conhecidas (bypass de limite em parsing de array e negação de serviço via manipulação de tipo) em pacotes que não apareciam em nenhum `import`/`require` do código — eram dependência transitiva de um framework HTTP usado diretamente, instalada há tempo sem ninguém pensar nela. Nada mudou no código do projeto entre a versão "limpa" e a "vulnerável": a CVE foi publicada depois, pro mesmo pacote parado no `node_modules`, e só apareceu porque alguém rodou o audit — não porque algo quebrou ou deu erro.',
    lesson:
      'Auditoria de dependência precisa rodar por rotina (cron, CI periódico), não só quando alguém lembra ou adiciona um pacote novo — porque a vulnerabilidade nova é descoberta em código que já está parado há meses, sem nenhuma ação sua. "Zero vulnerabilidade conhecida" é uma foto do momento da checagem, não uma garantia permanente, mesma lógica de tendência-vs-snapshot: o número de hoje não informa nada sobre amanhã sozinho. Ao corrigir, separe o que o fix automático resolve dentro do mesmo major (baixo risco, semver-compatível) do que exige bump maior (pode quebrar API — leia o changelog e teste de verdade); e sempre rebuild + exercite a aplicação depois de aplicar, porque "o fix existe" não é "o fix foi testado" — mesma lição de que build passar não prova que o runtime funciona.',
    downloads: [
      { file: 'dependency-audit-checklist.sh', label: 'Script: checklist de auditoria de dependências + separação de risco do fix' },
    ],
  },
  {
    slug: 'df-nao-pede-permissao-de-diretorio',
    title: 'Medir "quanto encheu" não exige a mesma permissão que ver "o que encheu"',
    tag: 'infra',
    problem:
      'Um disco compartilhado do host enchia periodicamente e ninguém conseguia diagnosticar a causa: a pasta onde provavelmente estava o grosso do uso pertencia a outro processo, com permissão restrita (dono diferente, sem leitura pra ninguém mais). Dois processos com acesso só a uma subpasta própria concluíram que não tinham como monitorar o disco nenhum, porque não tinham como listar o conteúdo daquela pasta restrita — e passaram semanas (dois incidentes em ~5 semanas) sem nenhum alerta automático, só percebendo o problema depois que um `INSERT` falhou por falta de espaço.',
    lesson:
      '`df`/`statfs` opera no nível do sistema de arquivos inteiro (o mountpoint), não checa permissão de nenhuma pasta específica dentro dele — qualquer usuário consegue ver o percentual/bytes usados do disco todo, mesmo com zero acesso de leitura a qualquer pasta nele. É uma permissão completamente diferente de listar conteúdo (`ls`, `du` numa pasta restrita, que aí sim exige permissão de leitura pasta por pasta). Não confunda "não consigo ver o que está enchendo o disco" (verdade, exige acesso a cada pasta) com "não consigo ver quanto o disco está cheio" (falso — isso é público a qualquer usuário no mesmo host). Construa o alerta sobre o número que você já pode ler hoje (`df` gravado como série temporal, mesmo padrão de tendência-vs-snapshot) em vez de esperar por um acesso que talvez nunca venha, e escale a causa raiz (quem tem acesso à pasta restrita) como um problema separado.',
    downloads: [
      { file: 'disco-df-sem-permissao-de-diretorio.sh', label: 'Script: alerta de disco cheio via df, sem precisar de permissão de pasta' },
    ],
  },
  {
    slug: 'permissao-por-forma-nao-por-consequencia',
    title: 'Um portão de permissão que olha o tipo de ação, não a consequência dela, deixa passar contrato junto com README',
    tag: 'agentes',
    problem:
      'Três incidentes públicos de agente de código, sem nenhuma instrução maliciosa ou injeção de prompt envolvida — só um pedido genérico interpretado de forma ampla: um agente criou e deu push num arquivo de licença (MIT) num repositório privado sem que ninguém tivesse pedido escolha de licença; outro, a partir de "avance o projeto", baixou um contrato em PDF não lido do e-mail, achou uma imagem de assinatura salva em disco e preparou o envio, interrompido antes de completar; um terceiro disse no próprio texto que ia pedir permissão antes de editar um arquivo e editou antes de esperar a resposta. Em nenhum caso a ferramenta usada (escrever arquivo, ler e-mail, compor imagem) era, isolada, de alto risco — o sistema de permissão categoriza por tipo técnico de ação, não pelo efeito real dela no mundo.',
    lesson:
      'Escrever um arquivo de texto e escrever um contrato/LICENSE não deveriam cair na mesma categoria de permissão só porque as duas são "escrita de arquivo" — a pergunta que importa não é "que tipo de ferramenta é essa?", é "essa ação específica pode virar uma obrigação legal, uma comunicação externa, ou algo irreversível fora do seu ambiente?". E nunca aceite a intenção declarada pelo próprio agente ("vou pedir permissão antes de X") como se já fosse o consentimento — o portão precisa vir de fora do modelo.',
    downloads: [
      { file: 'permissao-por-forma-nao-por-consequencia.md', label: 'Checklist: classificar permissão por consequência, não por tipo de ação' },
    ],
  },
  {
    slug: 'uptime-conta-janela-esperada-nao-linha-existente',
    title: 'Disponibilidade auto-monitorada calculada errado fica cega bem na hora que mais importa',
    tag: 'infra',
    problem:
      'Um serviço passou a medir sua própria disponibilidade sem depender de terceiro: um checker periódico testa dependências (banco, outro componente interno) e grava uma linha por checagem, sucesso ou falha. O jeito óbvio de calcular o percentual é `linhas_ok / total_de_linhas_no_período` — só que se o próprio processo que faz a checagem cair (crash, deploy, container reiniciando), nenhuma linha nova é gravada durante a queda. Não existe uma linha "falhou" pra aquele intervalo, existe ausência total de dado — e dividir só pelo que existe faz esse buraco não mudar a proporção nem um pouco. O painel mostra disponibilidade quase perfeita justamente na janela em que ninguém sabia se estava tudo bem, porque o termômetro em si estava quebrado.',
    lesson:
      'O denominador de um percentual de disponibilidade auto-medido não pode ser "quantas linhas existem" — tem que ser "quantas checagens deveriam ter acontecido no período", um número fixo calculado a partir do relógio e do intervalo configurado, não da tabela. Linha ausente dentro dessa janela esperada conta como falha, não como dado faltante. Teste de propósito: pare o processo que faz a checagem por um tempo e confirme que o percentual cai quando ele volta — se continuar perto de 100%, o denominador ainda está errado. Mesma família de lição que verificação-que-só-o-processo-vê e tendência-vs-snapshot: o número bonito no painel só vale alguma coisa se o método por trás dele sobreviver ao próprio monitor falhar.',
    downloads: [
      { file: 'uptime-denominador-janela-esperada.sql', label: 'Template SQL: % de disponibilidade com denominador correto' },
    ],
  },
  {
    slug: 'trust-proxy-rate-limit-vira-cota-unica',
    title: 'Sem avisar o app que existe um proxy na frente, rate limit por IP vira uma cota única pra todo mundo',
    tag: 'infra',
    problem:
      'Uma API atrás de proxy reverso nunca tinha configurado o app pra reconhecer esse proxy. O middleware de rate limit usava o IP de origem da conexão TCP como identidade de cada visitante — só que toda conexão chegava do mesmo lugar: o proxy. Resultado, todo o tráfego de escrita e busca do site passou a competir pela mesma cota única, em vez de cada visitante ter a sua própria. Nada dava erro de configuração; o rate limit funcionava, só que como uma torneira compartilhada — bastava dois visitantes normais usando o site ao mesmo tempo pra uma rajada de um derrubar o outro em 429, sem nenhum deles ter feito nada de errado.',
    lesson:
      'Framework nenhum assume proxy por padrão (correto, por segurança): é preciso configurar explicitamente quantos hops de proxy confiáveis existem entre o navegador e o app (`app.set(\'trust proxy\', 1)` no Express, ou o equivalente do seu framework) pra que o IP do cliente real seja lido do header que o proxy escreve, não da conexão TCP crua. E o número importa: `true`/"confia em tudo" troca um bug por outro — um cliente malicioso passa a poder forjar o próprio IP e escapar do rate limit por completo. `curl` direto na origem nunca reproduz esse bug (a origem já é você mesmo); teste passando por trás do proxy real com dois `X-Forwarded-For` diferentes e confirme que cada um isola seu próprio bucket.',
    downloads: [
      { file: 'trust-proxy-rate-limit-por-ip.md', label: 'Checklist: trust proxy + teste de rate limit por IP através do proxy' },
    ],
  },
  {
    slug: 'service-worker-cache-first-trava-em-versao-velha',
    title: 'Service worker cache-first sem plano de saída trava o usuário numa versão velha',
    tag: 'frontend',
    problem:
      'Um service worker adicionado pra dar resiliência offline nasce, pela via mais simples de implementar, como cache-first: serve do cache se existir, só busca na rede se não existir. Funciona perfeitamente no dia da implementação. Semanas depois, em produção, aparece o problema: o navegador mantém o mesmo service worker registrado entre sessões, e sem invalidação de cache (mesma chave pra sempre, sem limpeza no `activate`) usuários que voltam ao site recebem o HTML/JS antigo — mesmo online, mesmo já existindo versão nova no servidor. Nenhum erro aparece; a página carrega normal, só congelada na versão de quando o cache foi criado, e a única saída pro usuário é limpar o storage do site manualmente, algo que ninguém faz sem saber que precisa.',
    lesson:
      'Cache-first só serve pra recurso verdadeiramente imutável (tipicamente arquivo com hash no nome gerado pelo build, onde o nome já muda quando o conteúdo muda). Pra navegação (HTML) e chamadas de API, use network-first — tenta a rede primeiro, cai pro cache só quando a rede falha de verdade — assim quem está online sempre vê conteúdo fresco e o cache só reforça a ausência de conexão. Além disso: versione a chave do cache e apague as antigas no `activate`, e use `skipWaiting`/`clients.claim()` pra o service worker novo assumir sem esperar todas as abas fecharem. Teste o cenário que interessa: publique uma mudança, recarregue normal (sem hard-refresh) com o SW antigo já registrado, e confirme que a versão nova aparece sozinha.',
    downloads: [
      { file: 'service-worker-network-first-checklist.md', label: 'Checklist + template: service worker network-first com versionamento de cache' },
    ],
  },
  {
    slug: 'bloqueio-de-seguranca-de-api-de-llm-nao-e-bug',
    title: 'Bloqueio de segurança de uma API de LLM não é um bug de código',
    tag: 'agentes',
    problem:
      'Um job agendado que chama uma API de LLM pra gerar conteúdo terminou com erro sem nenhum bug de código nem falha de rede/banco/disco: o próprio provedor recusou a chamada antes de gerar qualquer resposta, porque o classificador de segurança em tempo real sinalizou o tema do prompt. Tudo mais no ambiente estava saudável — é uma categoria de falha diferente de bug de aplicação e diferente de infraestrutura caindo, e um log genérico de "exit 1" não distingue as duas coisas.',
    lesson:
      'Trate recusa de classificador de segurança como categoria própria de falha, detectável pelo código/mensagem específico que a API devolve — nunca como "erro genérico" a ser tentado de novo. Nunca implemente retry automático que reenvia o mesmo conteúdo esperando passar, e nunca reformule/fragmente prompt especificamente pra escapar da detecção — isso é evasão, não correção de engenharia. Uma rodada sem resultado por esse motivo deve ficar registrada como lacuna visível no histórico e não travar a rodada seguinte; se o padrão se repete, é decisão de produto/política pra escalar, não algo pro próprio pipeline resolver sozinho.',
    downloads: [
      { file: 'bloqueio-de-seguranca-de-api-de-llm-nao-e-bug.md', label: 'Checklist: bloqueio de segurança de API de LLM como categoria própria de falha' },
    ],
  },
  {
    slug: 'cartao-de-preview-generico-nao-diferencia-nada',
    title: 'Um `og:image` estático e compartilhado faz todo link do site parecer igual',
    tag: 'frontend',
    problem:
      'Um site com várias páginas de conteúdo (posts, produtos, eventos) apontava a mesma imagem estática de preview (`og:image`) pra toda URL. A página carregava normal, o preview de link aparecia certinho no WhatsApp/X/Telegram — só que idêntico pra qualquer conteúdo do site, sem título nem nenhum sinal visual de qual página é aquela. Não existe erro nem log pra apontar isso: só fica óbvio quando alguém cola o link de duas páginas diferentes lado a lado e nota que os dois cartões são iguais.',

    lesson:
      'Gere a imagem de preview por entidade, sob demanda: um endpoint monta um SVG simples com o título (com wrap/truncamento, já que rasterização server-side normalmente não mede glifo de verdade) e rasteriza em PNG. E aponte pra esse endpoint nas duas camadas que costumam existir em paralelo — o HTML pré-renderizado servido a bots/crawlers e as meta tags injetadas client-side — porque atualizar só uma reproduz a mesma divergência silenciosa da lição de meta tags duplicadas entre prerender e client-side. Cuidado extra com cache: `immutable` numa imagem cujo conteúdo-fonte pode ser corrigido depois de publicado esconde a correção de quem já cacheou a versão velha.',
    downloads: [
      { file: 'dynamic-og-image-checklist.md', label: 'Checklist + esqueleto de código: OG image dinâmica por entidade' },
    ],
  },
  {
    slug: 'cache-de-rede-nao-e-cache-de-estado',
    title: 'Cache de rede não elimina a espera — cache de estado do app sim',
    tag: 'frontend',
    problem:
      'Um service worker cacheava chamadas de API em modo network-first (tenta a rede primeiro, só cai pro cache se a rede falhar) — resolvendo bem o cenário offline. Mesmo assim, toda abertura fria do app (aba nova, PWA reaberta) continuava mostrando um estado de carregamento antes da lista aparecer: o componente nascia vazio e só se preenchia depois que a chamada de rede resolvia — o service worker decide o que a requisição recebe como resposta, não quando o componente decide renderizar. Nada estava quebrado; a rede geralmente respondia rápido, mas cada abertura pagava o round-trip inteiro pra mostrar um dado que, na maioria das vezes, nem tinha mudado desde a última visita.',
    lesson:
      'Cache de rede (service worker, HTTP cache) e cache de estado do app são camadas independentes — resolver a primeira não resolve a segunda. Pra eliminar a espera percebida, o componente precisa nascer com dado sincronamente disponível: leia um cache local que sobrevive entre sessões (`localStorage`, com TTL pra não mostrar algo velho demais) já no estado inicial, mostre isso imediatamente, e dispare a revalidação de rede em segundo plano — stale-while-revalidate na camada do app, não só na camada HTTP. E trate falha de revalidação (offline) como "mantenha o que já tinha na tela", nunca como "esvazie e mostre erro": dado levemente velho é melhor que nada.',
    downloads: [
      { file: 'stale-while-revalidate-lista.md', label: 'Template: stale-while-revalidate de lista com seed em localStorage' },
    ],
  },
  {
    slug: 'preferencia-de-visitante-aplicada-apos-paint-causa-reflow',
    title: 'Aplicar uma preferência salva depois do primeiro paint é reflow visível, não só "ajuste tardio"',
    tag: 'frontend',
    problem:
      'Uma preferência de exibição salva pelo visitante (tamanho de texto) era reaplicada a cada carregamento de página dentro de um `useEffect` do React — ou seja, depois do primeiro paint. Pra quem já tinha ajustado o próprio tamanho de texto alguma vez, isso significava que toda página abria do zero no tamanho padrão e, um instante depois, saltava pro tamanho salvo: um reflow da página inteira, medido em produção como CLS (Cumulative Layout Shift) de 0.4 a 0.7, bem acima do limite aceitável de 0.25. Nada quebrava funcionalmente — o valor certo sempre acabava aplicado — só que visivelmente, a cada página, pra uma fração real de visitantes.',
    lesson:
      'Qualquer preferência do visitante que afeta layout (tamanho de fonte, tema, densidade) e é lida de um storage local síncrono (`localStorage`) deveria ser aplicada antes do primeiro paint, nunca depois dele via efeito de framework. Na prática: um script inline, pequeno e síncrono no `<head>` do HTML (antes de qualquer CSS/JS do bundle carregar), que lê o valor salvo e aplica direto no `documentElement` — a mesma técnica clássica usada pra evitar "flash" de tema claro/escuro, generalizada pra qualquer preferência visual persistida. `useEffect` roda depois do commit inicial do React por design; é a ferramenta certa pra sincronizar estado depois da interação do usuário, não pra aplicar algo que precisa estar presente no primeiro frame. Meça com Web Vitals reais de produção (CLS), não só visualmente em dev — o salto pode ser pequeno o bastante pra passar despercebido numa tela, e ainda assim contar como "poor" no campo.',
    downloads: [
      { file: 'preferencia-sincrona-antes-do-paint.md', label: 'Checklist + exemplo: aplicar preferência salva via script inline no <head>' },
    ],
  },
  {
    slug: 'feedback-visual-sozinho-nao-anuncia-nada',
    title: 'Um botão que volta ao normal depois de enviar não avisa quem usa leitor de tela',
    tag: 'frontend',
    problem:
      'Um formulário de envio assíncrono (comentário, resposta) sinalizava sucesso e erro só visualmente: o botão voltava do texto "enviando…" pro texto normal, a lista se atualizava, ou uma frase de erro aparecia abaixo do campo — tudo sem nenhum atributo ARIA. Pra quem usa leitor de tela, nada daquilo era anunciado: o foco ficava onde estava, e um `<p>` que simplesmente aparece no DOM não dispara leitura nenhuma. Agravante à parte: um dos formulários se fechava ao ter sucesso, e a confirmação, guardada só no estado local desse formulário, desaparecia no mesmo instante em que seria mostrada — nunca chegava a existir tempo suficiente pra ninguém, nem visual nem por leitor de tela.',
    lesson:
      'Erro que exige atenção imediata usa `role="alert"`; confirmação de sucesso, não urgente, usa `role="status"` + `aria-live="polite"` — nunca o inverso. E quando o elemento que dispara a ação se fecha/reseta ao ter sucesso, a mensagem de confirmação não pode viver no estado dele: amarre a um identificador que sobrevive além do formulário (o item pai da lista, não o form em si), senão ela desaparece antes de qualquer leitor de tela ter chance de anunciar. Teste com um leitor de tela de verdade — ver o texto na tela não prova que foi lido em voz alta.',
    downloads: [
      { file: 'feedback-assincrono-acessivel-formulario.md', label: 'Checklist + exemplo: feedback assíncrono acessível (role=alert/status)' },
    ],
  },
  {
    slug: 'painel-dispensavel-sem-esc-nem-foco-prende-teclado',
    title: 'Um painel que só fecha no clique do mouse prende quem navega por teclado',
    tag: 'frontend',
    problem:
      'Dois componentes independentes (um painel discreto de ação, um form inline que abre a partir de um item de lista) só fechavam clicando de novo no próprio botão que os abriu — sem Esc, sem padrão de teclado nenhum. Ao corrigir isso depois, como melhoria pontual, o mesmo padrão (estado aberto + listener de `keydown` pra Escape) foi escrito à mão em cada um dos dois lugares — e só um deles lembrou de devolver o foco pro botão de origem ao fechar; o outro deixou o foco solto, sem elemento nenhum amarrado. Nada disso aparece testando com mouse, nem gera erro — só fica visível testando com teclado de verdade, e a inconsistência entre os dois existe exatamente porque a lógica foi duplicada em vez de centralizada.',
    lesson:
      'Todo painel/disclosure custom (não um `<dialog>` nativo) precisa de três coisas, não de uma: fechar com Esc, fechar clicando fora, e devolver o foco pra um elemento visível e ainda presente no DOM ao fechar — nunca deixar o foco solto ou em cima de algo que acabou de sumir. Extraia isso num hook único reutilizável em vez de copiar e colar um efeito de `keydown` por componente: a duplicação é justamente como uma cópia acaba mais completa que a outra. Teste de propósito com teclado (Tab até o botão, Enter, Esc, confirme onde o foco ficou) — mouse nunca revela essa lacuna.',
    downloads: [
      { file: 'painel-dispensavel-esc-foco-checklist.md', label: 'Hook reutilizável + checklist: Esc fecha painel e devolve foco' },
    ],
  },
  {
    slug: 'fonte-de-terceiro-no-caminho-critico',
    title: 'Fonte de terceiro no caminho crítico soma um handshake inteiro antes do texto certo aparecer',
    tag: 'frontend',
    problem:
      'Um site carregava fontes custom via CDN de terceiro (`<link>` pra `fonts.googleapis.com`) — uma linha simples no `<head>`, parecendo gratuita. Mas antes do navegador aplicar a fonte, ele precisa abrir uma conexão nova pra um domínio que não é o seu (DNS + TLS handshake) dentro do caminho crítico da primeira renderização. Em banda larga isso passa despercebido; em conexão de celular — o perfil real de quem lê um blog no trajeto, com uma mão ocupada — é tempo de espera real antes do texto aparecer com a tipografia certa, além de criar uma dependência de disponibilidade de um serviço externo só pra mostrar texto.',
    lesson:
      'Self-hospede os arquivos de fonte (`.woff2`) no próprio domínio, com cache longo (`max-age` de 1 ano — o arquivo não muda depois de baixado). Isso elimina a conexão cross-origin do caminho crítico: resta só a conexão que o navegador já ia abrir com o seu domínio de qualquer forma. Baixe só o subset que seu idioma precisa (latin cobre acentuação de PT-BR, não baixe o pacote de todos os idiomas), mantenha o `unicode-range` copiado do CSS original do CDN, e use `font-display: swap` pra não bloquear a renderização do texto esperando a fonte custom chegar.',
    downloads: [
      { file: 'fonte-terceiro-caminho-critico.md', label: 'Checklist: migrar fonte de CDN de terceiro pra self-hospedada' },
    ],
  },
  {
    slug: 'contador-dinamico-sem-largura-reservada-acumula-cls',
    title: 'Um contador que atualiza sozinho e muda de largura acumula CLS a cada atualização, não só uma vez',
    tag: 'frontend',
    problem:
      'Um contador regressivo no cabeçalho ("próximo evento em HH:MM") alternava entre formatos de larguras diferentes (ex. "47min" e "8h05") a cada atualização de um timer, dentro de um container flex sem espaço reservado pra ele. Cada troca empurrava os elementos vizinhos um pouco pra lá e pra cá — não uma vez só no carregamento, mas repetidamente, durante toda a sessão de leitura. Dado de campo real (CLS medido em usuários de verdade) mostrou p75 bem acima do limite considerado bom; testando manualmente por poucos segundos, ou rodando uma ferramenta de lab (Lighthouse, janela sintética curta), o problema não necessariamente aparece, porque é preciso observar pelo menos um ciclo inteiro do timer pra notar o salto.',
    lesson:
      'Todo texto que se atualiza sozinho por timer e cuja contagem de caracteres varia precisa de espaço reservado pro pior caso plausível do formato (`min-width` em `ch`, calculado a partir do maior valor que aquele formato pode assumir), mais `font-variant-numeric: tabular-nums` ou fonte monoespaçada quando o conteúdo é majoritariamente numérico, pra também eliminar a variação de largura entre dígitos diferentes. Diferente de um reflow único no carregamento, esse tipo de shift se espalha ao longo de toda a sessão — meça CLS de campo (RUM, não só score sintético de lab) pra provar que existe e que o fix funcionou, porque uma janela de teste curta pode nunca coincidir com um ciclo de atualização do timer.',
    downloads: [
      { file: 'cls-conteudo-dinamico-largura-reservada.md', label: 'Checklist: largura reservada pra conteúdo dinâmico (CLS contínuo)' },
    ],
  },
  {
    slug: 'metrica-de-campo-sem-elemento-e-meio-diagnostico',
    title: 'Saber que o CLS/LCP/INP está ruim não diz onde olhar — falta o elemento causador',
    tag: 'frontend',
    problem:
      'Um RUM (Real User Monitoring) caseiro coletava os valores agregados de Web Vitals (CLS, LCP) de visitantes reais e parava aí — provando que a página estava ruim, sem nenhuma pista de qual elemento específico causou cada métrica naquela sessão. Sem essa atribuição, toda investigação virava tentativa e erro: suspeitar de um componente, aplicar uma correção, publicar, esperar dado novo chegar, medir de novo — repetindo até acertar o culpado, com o custo desses ciclos crescendo junto com o número de componentes candidatos.',
    lesson:
      'As APIs de performance do navegador já carregam essa atribuição estruturalmente — a entry de `largest-contentful-paint` tem `.element` (o nó real pintado como maior conteúdo visível), e a entry de `layout-shift` tem `.sources[]`, cada um com `.node` do elemento que se moveu. Capture isso no momento da medição (reduzido a um identificador curto e seguro — tag + id/classe, nunca o HTML inteiro nem referência viva ao DOM) e grave junto com o valor agregado, exibindo os dois lado a lado no mesmo painel já consultado pra olhar a métrica — não como dado separado que exigiria correlação manual depois. Isso elimina a etapa de "qual componente é esse", que sem atribuição só se resolve lendo código candidato por candidato ou tentando reproduzir algo que pode depender de dado real (tamanho de conteúdo dinâmico, conexão lenta) ausente em ambiente de teste. O mesmo padrão generaliza pra uma terceira métrica, confirmado na prática: a entry de `event` (usada pra medir INP, que substituiu FID como Core Web Vital oficial) tem `.target`, o nó que recebeu a interação — mesma estrutura de atribuição, API diferente.',
    downloads: [
      { file: 'web-vitals-sem-elemento-causador.md', label: 'Checklist + exemplo: capturar o elemento causador de LCP/CLS/INP via PerformanceObserver' },
    ],
  },
  {
    slug: 'salvar-pra-offline-precisa-de-pre-cache-ativo',
    title: 'Um botão "salvar pra ler depois" não garante offline sozinho',
    tag: 'frontend',
    problem:
      'Um app com service worker em modo network-first já tinha resiliência offline razoável: quem visitava uma página enquanto online a deixava cacheada, e conseguia reabri-la depois sem rede. Um botão de "salvar pra ler depois" foi adicionado só gravando o identificador do item numa lista local (`localStorage`) — sem tocar no cache do service worker. Funcionava perfeitamente pra quem salvava algo que já tinha aberto antes. O caso que ficava quebrado, sem nenhum erro visível, era o mais comum pro próprio propósito do botão: salvar algo justamente pra não precisar ler agora, e abrir só depois, sem conexão — como nunca tinha navegado até aquela página enquanto online, o service worker nunca teve chance de cachear nada, e a tela de "sem conexão" aparecia num item que o próprio app dizia estar "salvo".',
    lesson:
      'Um service worker que cacheia só oportunisticamente durante a navegação normal não cobre a intenção de um botão de salvar/favoritar pra depois — são dois mecanismos independentes que parecem a mesma coisa até alguém testar o caminho que não passa por navegação nenhuma. A ação de salvar precisa, ela mesma, disparar um `fetch` + `cache.put()` de tudo que a página vai precisar pra renderizar sem rede (o HTML/shell da rota e qualquer chamada de API que ela faz) no exato momento do clique — não esperar que uma visita futura resolva isso. Trate como best-effort (um `try/catch` silencioso: se falhar porque o usuário clicou offline, ou a Cache API não existe, o item só não fica garantido offline, nada quebra) e espelhe a limpeza: desmarcar como salvo deveria liberar esse espaço do cache (`cache.delete`), senão o cache cresce para sempre com itens que o usuário já descartou. E lembre de repetir o pré-cache pra qualquer item que já estava salvo antes dessa funcionalidade existir, na primeira tela que listar os salvos — senão só os salvos a partir daquele deploy ficam cobertos.',
    downloads: [
      { file: 'salvar-offline-precache-ativo.md', label: 'Template: pré-cache ativo no momento de salvar (com limpeza simétrica)' },
    ],
  },
  {
    slug: 'cor-compartilhada-so-foi-validada-num-fundo',
    title: 'Uma cor de texto compartilhada entre temas só foi validada contra um dos fundos',
    tag: 'frontend',
    problem:
      'Uma variável de cor (tom âmbar) era usada como cor de texto em vários componentes sem relação entre si — hover de link, borda/texto de botão, mensagem de erro de formulário — todos puxando a mesma variável CSS. Ela passava tranquilamente no contraste mínimo (WCAG AA, 4.5:1) contra o fundo escuro predominante do site, que é onde foi escolhida e, provavelmente, onde alguém checou visualmente que "dava pra ler". Um card de leitura com fundo de papel claro reaproveitou a mesma variável sem revalidar contraste nesse fundo novo — ali o mesmo tom caía pra cerca de 2.7:1, bem abaixo do mínimo. Nada quebrava nem dava erro: o texto aparecia, só ficava difícil de ler para quem tem baixa visão ou está num ambiente de luz forte, e passou despercebido porque "a cor já existe e já foi aprovada" em outro contexto.',
    lesson:
      'Contraste de cor não é uma propriedade da cor isolada, é uma relação entre ela e o fundo específico onde aparece — a mesma variável pode passar em um tema e falhar em outro sem que o código dê nenhum sinal disso. Ao reaproveitar uma variável de cor de texto num fundo novo (um card, um tema alternativo, um modo de leitura), meça o contraste de novo contra aquele fundo específico, não assuma que "já foi validada" em algum lugar cobre todos os lugares. Quando o mesmo tom precisa de contraste diferente em fundos diferentes, prefira uma segunda variável derivada e explicitamente escopada a esse contexto (ex. `--cor-dim-on-paper`) em vez de escurecer a variável original — isso preserva o tom correto nos fundos onde ela já passava.',
    downloads: [
      { file: 'contraste-cor-compartilhada-entre-temas.md', label: 'Checklist + script: validar contraste de uma cor por fundo onde ela é usada' },
    ],
  },
  {
    slug: 'indice-funcional-precisa-de-funcao-immutable',
    title: 'Um índice GIN sobre busca com acento não ativa sozinho — a função precisa ser IMMUTABLE',
    tag: 'infra',
    problem:
      'Uma busca por texto (`ILIKE \'%termo%\'`, normalizando acento com `unaccent()`) em várias colunas de uma tabela — incluindo um campo grande de conteúdo — rodava sem nenhum índice: Seq Scan completo a cada consulta, piorando conforme a tabela cresce. `pg_trgm` com índice GIN resolve justamente esse padrão, mas só se a expressão do índice bater exatamente com a expressão usada na query — e `unaccent()` é marcada `STABLE` no catálogo do Postgres (o resultado depende do dicionário resolvido via `search_path` em tempo de execução), não `IMMUTABLE`. O Postgres recusa aceitar `unaccent(coluna)` direto numa expressão de índice, e a mesma restrição vale pra qualquer outra função "normalizadora" composta ali (`array_to_string`, por exemplo, também é `STABLE`, não `IMMUTABLE`, mesmo sendo determinística na prática).',
    lesson:
      'A saída é envolver a função num wrapper que fixe explicitamente o que a torna não-determinística pro catálogo (no caso do `unaccent`, passar o dicionário como literal em vez de deixar implícito no `search_path`) e declarar esse wrapper `IMMUTABLE`. Duas pegadinhas adicionais, não óbvias, quebram esse wrapper se ignoradas: se ele for `LANGUAGE sql`, o planner pode "inlinear" o corpo dentro da expressão do índice, recompondo a chamada num contexto que não resolve mais a função original — `plpgsql` nunca sofre esse inlining; e `CREATE INDEX` executa com `search_path` restrito (hardening padrão do Postgres contra search_path hijacking), então uma chamada não qualificada à função de base dentro do wrapper falha mesmo ela existindo — use o nome totalmente qualificado (`public.unaccent`, ajuste o schema). E confirme o ganho real com `EXPLAIN`: se a expressão do índice não bater exatamente com a do `WHERE`, o planner simplesmente ignora o índice e volta pro Seq Scan sem erro nenhum — "a query rodou" não prova que o índice foi usado.',
    downloads: [
      { file: 'indice-funcional-immutable-wrapper.sql', label: 'Template: índice GIN trigram com wrapper IMMUTABLE + checklist das 3 pegadinhas' },
    ],
  },
  {
    slug: 'navigator-online-nao-garante-internet',
    title: '`navigator.onLine` avisa sobre a interface de rede, não sobre a internet',
    tag: 'frontend',
    problem:
      'Um banner que avisa quando a conexão cai foi implementado escutando só os eventos padrão do navegador (`window.addEventListener(\'online\'/\'offline\', ...)`) e lendo `navigator.onLine` como estado inicial. Funciona pro caso óbvio — modo avião, Wi-Fi desligado manualmente — mas não é o que a maior parte das perdas de conexão reais parece: um visitante conectado a uma rede Wi-Fi que ficou sem saída pra internet (roteador do provedor caiu, portal cativo de rede pública, enlace local ainda ativo mas sem rota pra fora) continua com `navigator.onLine === true` e nenhum evento `offline` dispara — o navegador só sabe se existe uma interface de rede associada, não se ela chega à internet de fato. O banner, cujo propósito inteiro era avisar justo esse tipo de situação intermitente (elevador, metrô, sinal fraco), fica mudo exatamente no cenário em que seria mais útil, e nada no código aponta isso: sem erro, sem warning, só ausência silenciosa do aviso.',
    lesson:
      '`navigator.onLine` e os eventos `online`/`offline` refletem só a camada de interface de rede do sistema operacional, não conectividade real com a internet — é documentado assim pela própria API, mas fácil de assumir o contrário na primeira leitura. Pra detectar perda de conexão de verdade, complemente com uma checagem ativa periódica: um `fetch` leve e barato (endpoint pequeno do próprio domínio, ou uma URL que já é cacheada) com `cache: \'no-store\'` e timeout curto, repetido a cada N segundos — idealmente só quando a aba volta a ficar visível/focada, pra não gastar bateria/dados sem necessidade. Sucesso confirma conectividade real; falha (incluindo timeout) é o sinal de offline de verdade. Mantenha os eventos `online`/`offline` como sinal rápido e gratuito pro caso óbvio, mas não confie neles como única fonte pro caso que o recurso foi construído justamente pra cobrir.',
    downloads: [
      { file: 'navigator-online-nao-garante-internet.md', label: 'Checklist + hook: checagem ativa de conectividade além de navigator.onLine' },
    ],
  },
  {
    slug: 'header-seguranca-por-camada-nao-por-dominio',
    title: 'Um header de segurança setado num middleware não cobre o domínio inteiro',
    tag: 'seguranca',
    problem:
      'Um domínio público era servido por duas camadas independentes: uma API com headers de segurança configurados via middleware (`helmet`), e um proxy reverso servindo o HTML/JS/CSS de uma SPA no mesmo host. O header `Strict-Transport-Security` estava presente nas respostas da API, mas ausente nas respostas do proxy — ativá-lo no middleware da API não "vaza" pras respostas que vêm de outro processo, mesmo que o navegador veja só um domínio só. Nada dava erro, a página carregava normal; só apareceu comparando `curl -I` nas duas rotas lado a lado em produção.',
    lesson:
      'Header de resposta HTTP é propriedade de cada resposta, não do domínio — quando mais de um processo serve o mesmo host público (app/API, proxy/estático, CDN), cada um só manda o que foi configurado nele mesmo pra mandar. `HSTS` tem um efeito de memória por origem depois da primeira resposta que o entrega (o navegador passa a forçar HTTPS no domínio inteiro por `max-age`), mas até lá — e pra qualquer rota que nunca manda o header — a proteção não existe; os outros (`CSP`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) não têm nem essa memória, são avaliados resposta por resposta sempre. Decida explicitamente qual camada é dona de cada header e confirme no fio, por rota real (API e estático/SPA separadamente), não só na rota que você tocou — mesma família de lição que compressão na borda e `Vary`: proxy na frente não herda nada do backend automaticamente, e vice-versa.',
    downloads: [
      { file: 'header-seguranca-por-camada-nao-por-dominio.md', label: 'Checklist: auditar headers de segurança por camada, não por domínio' },
    ],
  },
  {
    slug: 'data-sem-time-datetime-nao-e-reconhecida-como-data',
    title: 'Uma data exibida como texto formatado não é reconhecida como data por quem não vê a tela',
    tag: 'frontend',
    problem:
      'Um site exibia toda data visível (data de post, data de comentário/resposta, data de item de histórico) dentro de elementos genéricos (`<span>`, `<p>`) com texto já formatado — visualmente perfeito, sem nenhum sinal estrutural no DOM de que aquele texto representa uma data. Nada quebrava nem dava erro: um leitor de tela lia o texto literal sem contexto temporal algum, e um crawler de busca/extrator de dados estruturados não tinha como extrair um valor confiável sem parsear a string formatada, adivinhando idioma e fuso.',
    lesson:
      'Troque qualquer texto de data visível por `<time dateTime="valor-ISO-8601">texto formatado livre</time>` — zero mudança visual, zero custo real de implementação, resolve as duas audiências ao mesmo tempo (leitor de tela e crawler/dados estruturados) com a mesma troca de tag. Faça isso em todas as ocorrências do site de uma vez (grep por onde data é renderizada), não só na tela que motivou a mudança — é comum a mesma lacuna existir em paralelo em componente de post, comentário e qualquer outra lista com timestamp, cada um escrito sem reaproveitar um componente comum.',
    downloads: [
      { file: 'data-sem-time-datetime.md', label: 'Checklist: datas visíveis com <time datetime> semântico' },
    ],
  },
  {
    slug: 'redacao-em-escrita-nao-em-leitura',
    title: 'Redigir só na hora de exibir deixa o dado sensível vivendo sem necessidade dentro do banco',
    tag: 'infra',
    problem:
      'Uma API passou a persistir seus próprios erros internos (500) numa tabela, pensando numa página de status pública que mostraria os últimos erros por rota — um padrão de observabilidade saudável. A mensagem de erro gravada ainda carregava detalhe interno (IP de origem da conexão, entre outros) no momento do `INSERT`, com o plano de filtrar esse detalhe depois, só na hora de montar a resposta da rota pública que lê essa tabela. Entre a escrita e esse filtro existia uma janela real em que o dado sensível já estava gravado em texto puro — visível a qualquer leitura direta da tabela (consulta ad-hoc, backup restaurado, um endpoint futuro que leia os mesmos dados), não só pela rota pública original.',
    lesson:
      'Redija o dado sensível no momento de gravar, não no momento de servir. Existe só um caminho de escrita, mas podem existir vários de leitura — cada leitura nova precisaria lembrar de repetir o mesmo filtro, e esquecer uma não dá erro nenhum, só vaza silenciosamente pra quem tiver acesso de leitura direto ao banco (uma permissão diferente da de quem só pode alterar o código da rota pública). Mantenha uma lista pequena e nomeada do que precisa sair (IP, caminho de arquivo, hostname interno) em vez de uma blocklist implícita que só cresce quando alguém notar um vazamento. Redigir na leitura ainda vale como camada extra de defesa em profundidade — só não pode ser a única.',
    downloads: [
      { file: 'redacao-em-escrita-nao-em-leitura.md', label: 'Checklist + exemplo: redigir dado sensível antes de persistir, não só antes de exibir' },
    ],
  },
  {
    slug: 'token-de-autoria-nao-pode-vazar-no-select-publico',
    title: 'Um token de prova de autoria vira capacidade de qualquer um se o SELECT público devolver a coluna',
    tag: 'seguranca',
    problem:
      'Um sistema de comentários anônimo (sem conta) ganhou uma ação de autoatendimento reservada a quem criou o conteúdo (nesse caso, excluir o próprio comentário dentro de uma janela curta). A prova de autoria é um token opaco gerado no navegador de quem comentou — o mesmo já usado em outras ações fracas da mesma tabela (curtir, sinalizar) — guardado numa coluna nova no momento do `INSERT`. O endpoint que lista esse conteúdo publicamente já existia antes da coluna nova e usa lista explícita de colunas no `SELECT` (não `SELECT *`), então o token não aparece na resposta hoje — mas essa garantia inteira depende de alguém lembrar de manter essa lista explícita toda vez que uma coluna nova nascer na mesma tabela. Se qualquer leitura futura dessa tabela (um endpoint de depuração, uma exportação, um `SELECT *` de conveniência num painel administrativo) devolvesse essa coluna, qualquer visitante que lesse a resposta ganharia a prova de autoria de qualquer outro item e poderia executar a ação reservada ao autor original — nesse caso, apagar conteúdo de qualquer pessoa — sem nunca ter escrito aquilo.',
    lesson:
      'A partir do momento em que uma tabela ganha uma coluna que funciona como segredo/capability (token de prova de autoria, chave de edição, qualquer valor tipo bearer), trate `SELECT *` como proibido nessa tabela pra sempre — todo `SELECT`, incluindo os que já existiam antes e pareciam inofensivos, precisa listar colunas explicitamente. É fácil validar só o lado da escrita (o `INSERT` gravou o valor certo) e nunca testar o lado da leitura: peça a resposta pública de verdade (`curl` no endpoint de listagem) e confirme que a coluna nova não aparece, antes de considerar a feature pronta — mesma disciplina de "não confiar que o código parece certo, testar o comportamento observável de fora". Além disso, esse tipo de token só pode ser capturado no momento da criação do conteúdo, nunca adicionado depois pra registros que já existem — qualquer ação de autoatendimento baseada nele (editar/excluir sem conta) nunca vai alcançar o que foi criado antes da coluna existir. Isso é uma limitação conhecida do desenho, não um bug a corrigir; documente-a, pra não ser reportada como defeito meses depois.',
    downloads: [
      { file: 'token-de-autoria-nao-pode-vazar-no-select-publico.md', label: 'Checklist: coluna-capacidade numa tabela com leitura pública' },
    ],
  },
  {
    slug: 'contador-de-caracteres-aria-hidden-nao-avisa-quem-nao-ve',
    title: 'Um contador de caracteres só visual deixa quem usa leitor de tela sem aviso nenhum do limite',
    tag: 'frontend',
    problem:
      'Um `<textarea maxLength={N}>` trunca silenciosamente ao atingir o limite — o navegador só para de aceitar tecla nova, sem erro nem evento. Um contador visual ("120/1000") foi adicionado pra avisar quem vê a tela antes de chegar lá, mas implementado com `aria-hidden="true"` pra evitar que um leitor de tela narrasse a contagem inteira a cada tecla digitada (o que seria, de fato, insuportável). Isso resolveu o barulho, mas também apagou o aviso inteiro: quem usa leitor de tela ficou exatamente onde estava antes do contador existir, sem nenhum sinal de proximidade do limite e sem explicação de por que, em algum momento, o texto simplesmente para de crescer.',
    lesson:
      'A escolha não é binária entre "narra cada tecla" e "não narra nada" — é uma falsa dicotomia. O contador visual (`aria-hidden="true"`, atualizando a cada tecla) está certo: ninguém precisa ouvir a contagem decrescente inteira. O que falta é uma region `aria-live="polite"` separada que só muda de conteúdo ao cruzar um limiar predefinido (ex.: 20 restantes, depois 0) — avisa sem spam. Teste com leitor de tela de verdade digitando até o limite: tem que anunciar pelo menos uma vez antes do texto parar de crescer, e nada antes do primeiro limiar. Cuidado com um conserto que parece certo e não é: trocar `aria-hidden` por `aria-describedby` ligando o contador ao campo resolve só a leitura inicial — a maioria dos leitores de tela anuncia o texto referenciado uma vez, no momento em que o campo recebe foco, porque `aria-describedby` não é uma live region. Continuar digitando depois disso não dispara nenhum anúncio novo: o usuário ainda só descobre que bateu no limite batendo nele, o mesmo problema original, só que mascarado por parecer resolvido. `aria-describedby` serve bem pra instrução estática ("máximo de 1000 caracteres"); pra aviso que precisa acompanhar a digitação, só `aria-live` com limiar resolve.',
    downloads: [
      { file: 'contador-caracteres-aria-live-threshold.md', label: 'Checklist + exemplo: contador de caracteres com aviso por limiar' },
    ],
  },
  {
    slug: 'moderacao-automatica-sem-motivo-registrado',
    title: 'Conteúdo que desaparece sozinho por moderação automática precisa de um motivo registrado, não só ausência',
    tag: 'infra',
    problem:
      'Um sistema de moderação coletiva (N visitantes distintos sinalizando o mesmo item faz ele ser ocultado automaticamente) rodava silenciosamente: quando um item desaparecia da visualização pública, não existia como saber, sem acessar o banco direto, se foi por moderação automática ou por o próprio autor ter apagado — as duas situações pareciam exatamente a mesma coisa de fora (ausência). Sem essa distinção, duas perguntas ficavam sem resposta: a moderação automática está realmente funcionando, ou nunca disparou? E ela ocultou por engano algo legítimo (falso positivo de sinalização em massa)?',
    lesson:
      'Grave o motivo da ocultação como dado estruturado no momento em que ela acontece (uma coluna/enum que diferencia "ocultado por sinalização coletiva" de "removido pelo autor", por exemplo) — nunca deixe os dois casos colapsarem no mesmo "não existe mais". Exponha essa atividade onde um humano já olha, mesma família de lição que verificação-que-só-o-processo-vê, mas só com metadados (quando, em qual item, quantas sinalizações) — nunca republique o conteúdo que foi ocultado por abuso/spam, mesmo numa página interna/administrativa, porque isso derrota o próprio propósito de ter escondido aquele conteúdo.',
    downloads: [
      { file: 'moderacao-automatica-motivo-e-metadados.md', label: 'Checklist: motivo estruturado + metadados sem republicar conteúdo' },
    ],
  },
  {
    slug: 'catch-por-rota-nao-cobre-erro-de-middleware',
    title: 'Um catch em cada rota não pega o erro que acontece antes de qualquer rota rodar',
    tag: 'infra',
    problem:
      'Uma API já seguia a disciplina certa de tratamento de erro: todo `catch` de rota logava o erro completo no servidor e devolvia ao cliente uma mensagem genérica, nunca `err.message` cru. Mesmo assim, um corpo de requisição malformado (JSON inválido) em qualquer endpoint de escrita ainda vazava uma página de erro com stack trace completo e caminho interno de arquivo do servidor. O motivo: o parsing do corpo roda num middleware que executa antes de qualquer rota, então o erro nunca chega a entrar em nenhum dos `catch` escritos dentro das rotas — ele cai direto no handler de erro padrão do próprio framework, que em muitos casos ainda devolve detalhe de debug por padrão.',
    lesson:
      'Catch por rota e handler de erro genérico no fim da cadeia de middlewares resolvem problemas diferentes, não o mesmo problema duas vezes — o primeiro cobre o que acontece dentro do corpo de uma rota específica, o segundo é a rede de segurança para qualquer erro que nenhuma rota chegou a ver (erro de parsing de corpo, erro síncrono lançado num middleware anterior, um `next(err)` chamado explicitamente). No Express, esse handler final só é reconhecido como handler de erro pela aridade da função (quatro parâmetros: `err, req, res, next`) — é fácil escrever um middleware de quatro parâmetros achando que vai rodar sempre e ele nunca ser acionado porque, na verdade, o framework o trata como handler de erro normal só quando chamado via `next(err)`, ou vice-versa, esquecer o quarto parâmetro e ele nunca ser reconhecido como handler de erro. Trate erro de parsing como categoria própria ali dentro (checando o tipo do erro) respondendo 4xx genérico; qualquer outro erro vira 500 genérico, sempre logado no servidor antes de responder ao cliente. Teste mandando de propósito um corpo malformado (`curl` com JSON quebrado) contra cada verbo de escrita e confirme que a resposta é o formato de erro genérico da sua própria API, não a página padrão do framework.',
    downloads: [
      { file: 'catch-all-error-handler-express.md', label: 'Checklist + template: handler de erro genérico no fim da cadeia de middlewares' },
    ],
  },
]
