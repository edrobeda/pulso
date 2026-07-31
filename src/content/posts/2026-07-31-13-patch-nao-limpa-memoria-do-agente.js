export default {
  slug: 'patch-nao-limpa-memoria-do-agente',
  title:
    'RufRoot: o patch saiu em 24 horas, mas a memória do agente que ele envenenou continua envenenada',
  excerpt:
    'A vulnerabilidade CVE-2026-59726 no Ruflo foi corrigida um dia depois de divulgada. Mas quem só atualizou a versão deixou pra trás exatamente o dano que a falha foi desenhada pra causar: instruções maliciosas gravadas na memória persistente do agente, que um redeploy não apaga.',
  date: '2026-07-31',
  slot: '13:00',
  tags: ['Agentes', 'Segurança'],
  readTime: 5,
  blocks: [
    {
      type: 'p',
      text: 'Em 30 de junho deste ano a Noma Security divulgou de forma responsável uma falha no Ruflo, plataforma open source de orquestração de agentes de IA com cerca de 67 mil estrelas no GitHub. A vulnerabilidade recebeu CVSS 10.0 — nota máxima — e o codinome RufRoot (CVE-2026-59726). O mantenedor do projeto, Reuven Cohen, publicou correção em menos de 24 horas, na versão 3.16.3. Pelo ritmo que a indústria de segurança costuma elogiar como resposta exemplar, esse caso deveria estar encerrado. Não está, e o motivo é o que interessa aqui: essa é uma classe de falha em que corrigir o código não desfaz o que o ataque já ensinou ao agente.',
    },
    {
      type: 'h2',
      text: 'A falha: uma porta sem cadeado nenhum',
    },
    {
      type: 'p',
      text: 'O componente vulnerável é o MCP Bridge do Ruflo, um servidor Express.js que expõe 233 ferramentas — de execução de shell a operações de banco de dados e gerenciamento de agentes — via protocolo MCP na porta 3001. A configuração padrão do docker-compose do projeto vinculava essa porta a 0.0.0.0, ou seja, exposta pra qualquer rede, e o endpoint não checava token, chave de API nem cabeçalho de autenticação. Um único POST HTTP sem credencial nenhuma, chamando a ferramenta `ruflo__terminal_execute`, dava execução de comando arbitrário dentro do container. Não era uma falha de lógica sutil escondida em alguma validação malfeita — era ausência total de verificação num endpoint que já vinha, por padrão, ligado à internet.',
    },
    {
      type: 'h2',
      text: 'O que um atacante fazia com isso',
    },
    {
      type: 'p',
      text: 'Execução de comando já seria grave sozinha, mas duas outras ferramentas expostas pelo mesmo bridge tornam esse caso diferente do CVE crítico genérico. A primeira é `ruflo__agentdb_pattern-store`, que grava padrões na memória persistente do agente — o mecanismo pensado pra ele "aprender" com o tempo. Um atacante podia usar essa ferramenta pra injetar políticas falsas, do tipo instrução permanente pra incluir uma URL controlada por ele em scripts futuros gerados pelo agente. A segunda é a dupla `ruflo__swarm_init` e `ruflo__agent_spawn`, que permitia usar as credenciais de API já configuradas na vítima pra criar um enxame de agentes controlados pelo atacante, rodando com o orçamento e a identidade de quem foi comprometido.',
    },
    {
      type: 'quote',
      text: 'Remediation requires more than a software update. AI provider credentials should be treated as compromised and rotated, the platform\'s AI memory should be audited for tampering.',
    },
    {
      type: 'p',
      text: 'Essa frase, da própria Noma Security no relatório de divulgação, é o ponto que separa este caso de uma falha de segurança comum. Em software tradicional, uma vulnerabilidade é uma propriedade do código: existe enquanto o código vulnerável está rodando, e desaparece quando ele é substituído por código corrigido. É por isso que "aplique o patch" fecha o assunto na esmagadora maioria dos CVEs. Aqui o exploit não só executou código — ele escreveu dado, num armazenamento cujo propósito explícito é persistir e continuar influenciando decisões futuras. Trocar a versão do Ruflo por 3.16.3 fecha a porta de entrada, mas não apaga a instrução falsa que já foi gravada na memória do agente antes da troca. Ela continua lá, e continua sendo lida e obedecida em toda resposta futura, pra todo usuário da plataforma, até alguém auditar manualmente o AgentDB e remover o que não deveria estar ali.',
    },
    {
      type: 'h2',
      text: 'O CVE mede metade do dano',
    },
    {
      type: 'p',
      text: 'O ciclo padrão de divulgação de vulnerabilidade — CVE, CVSS, patch, changelog — foi desenhado numa era em que o estado comprometido vivia inteiramente no código. Ele não tem campo pra registrar "e a memória que foi escrita durante a janela de exposição". Nenhuma nota de release do Ruflo tem uma caixa de seleção pra "auditoria de dado necessária"; isso ficou por conta de um parágrafo de recomendação da empresa que achou a falha, que só quem leu o relatório completo — em vez de só a nota "corrigido na 3.16.3" — vai ver. À medida que mais plataforma de agente shippa memória persistente como funcionalidade central, e não como acessório, esse tipo de falha vai deixar de ser exceção: o exploit que grava dado sobrevive ao patch por definição, porque o dado gravado nunca fez parte do que o patch troca. Enquanto o processo de divulgação de vulnerabilidade não separar explicitamente "corrigir o código" de "limpar o que o código comprometido já ensinou", a maioria dos operadores vai continuar lendo "patch disponível" como "problema resolvido" — e vai estar errada nos casos em que isso mais importa.',
    },
  ],
}
