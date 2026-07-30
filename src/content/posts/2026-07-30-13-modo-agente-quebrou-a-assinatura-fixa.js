export default {
  slug: 'modo-agente-quebrou-a-assinatura-fixa',
  title:
    'Modo agente quebrou a conta: por que "ilimitado" sumiu de toda ferramenta de código com IA em 2026',
  excerpt:
    'Em SaaS tradicional, o cliente mais assíduo é o mais lucrativo, porque usar o produto de novo quase não custa nada a mais. Em ferramenta de código com IA é o oposto — e GitHub Copilot, Cursor e Anthropic abandonaram o plano fixo na mesma janela de meses, todos citando o mesmo gatilho: sessão de agente autônomo.',
  date: '2026-07-30',
  slot: '13:00',
  tags: ['Economia de IA', 'Ferramentas de Código'],
  readTime: 5,
  blocks: [
    {
      type: 'p',
      text: 'Em 1º de junho deste ano o GitHub aposentou o modelo de Premium Request Units do Copilot — um número fixo de requisições por mês, todas com o mesmo peso — e trocou por AI Credits, cobrados por token de entrada, saída e cache, ao preço de API de cada modelo. Não foi um caso isolado. Em março a Anthropic reconheceu publicamente que assinantes do Claude Code Max estavam esgotando a cota de cinco horas em 19 minutos, bem mais rápido do que o esperado, e passou o ano ajustando limite atrás de limite. A Cursor trocou um teto de 500 requisições rápidas por mês por um crédito de 20 dólares cobrado a preço de API — usuário pesado que pagava perto de 100 dólares por mês passou a gastar 20 a 30 dólares por dia. Três empresas, três produtos, a mesma direção, na mesma janela de poucos meses: o plano fixo mensal está saindo de cena em ferramenta de código com IA, e vale a pena entender por que isso não é coincidência de gestão de produto.',
    },
    {
      type: 'h2',
      text: 'A conta que o SaaS ensinou',
    },
    {
      type: 'p',
      text: 'Assinatura mensal fixa é uma invenção do software tradicional, e funciona porque ali o custo marginal de um cliente usar o produto de novo é próximo de zero. Depois que o Jira ou o Notion estão construídos, mais um clique de um cliente que já paga não consome quase nenhum recurso adicional real — o custo pesado foi construir o produto, não rodá-lo. Isso inverte a lógica de venda: o cliente ideal é justamente o mais assíduo, o que abre o produto todo dia e nunca cancela, porque cada uso a mais dele é lucro quase puro pra empresa. É a economia que sustentou duas décadas de "unlimited" em SaaS B2B.',
    },
    {
      type: 'p',
      text: 'Ferramenta de código com IA copiou a embalagem — preço fixo mensal, camadas de plano, "ilimitado" no nome — sem copiar essa economia. Cada requisição consome tokens de verdade, cobrados a preço de API de verdade, e isso é custo variável desde o primeiro uso, não custo fixo amortizado. Enquanto o uso típico era pergunta pontual de chat, a diferença era pequena demais pra doer. O ano de 2026 é quando parou de ser pequena.',
    },
    {
      type: 'h2',
      text: 'O gatilho foi o modo agente, não o volume',
    },
    {
      type: 'p',
      text: 'O texto oficial do GitHub sobre a mudança de junho é direto sobre o motivo, e vale citar porque nomeia o mecanismo exato:',
    },
    {
      type: 'quote',
      text: 'A quick chat question and a multi-hour autonomous coding session can cost the user the same amount.',
    },
    {
      type: 'p',
      text: 'Essa frase é o resumo do problema inteiro. Um plano por unidade de requisição — ou por assinatura fixa — assume implicitamente que cada uso do produto custa mais ou menos a mesma coisa, uma suposição que sobrevive enquanto o produto é usado em rajadas curtas com humano no controle a cada passo. Modo agente quebra essa suposição na raiz: uma sessão autônoma de horas, rodando sem intervenção, consome ordens de grandeza mais token do que uma pergunta de chat, mas contava como a mesma "requisição" no esquema antigo. Um relato público de assinante do Copilot Pro Plus (7.000 requisições premium por mês) descreveu ter consumido 15% da cota inteira em duas a três horas de uso em modo agente logo no dia da virada de junho — e chamou o plano de inviável pra uso sério de agente, não por acidente de configuração, mas porque o produto estava, finalmente, fazendo o que promete fazer.',
    },
    {
      type: 'h2',
      text: 'Não é gestão malfeita, é estrutural',
    },
    {
      type: 'p',
      text: 'A margem bruta ajuda a explicar por que isso não tem conserto fácil dentro do modelo antigo. Serviço de SaaS tradicional roda com margem bruta de 80-90%, porque o custo de servir mais um cliente é quase zero. Serviço construído sobre inferência de modelo roda mais perto de 50-60%, porque cada resposta consome computação de verdade, com custo que escala junto com o uso em vez de diluir com ele. Isso significa que, sob assinatura fixa, o cliente mais engajado — exatamente o que a ferramenta foi construída pra atrair, o desenvolvedor que deixa o agente rodando o dia inteiro — é também o que mais perde dinheiro pra empresa que vende a ferramenta. É o oposto exato do incentivo que fez o "ilimitado" funcionar em SaaS por vinte anos.',
    },
    {
      type: 'p',
      text: 'O ponto que fica claro ao juntar os três casos — GitHub em junho, Anthropic em março, Cursor ao longo do ano — é que nenhuma das três empresas escolheu isso por má gestão de produto isolada: as três bateram na mesma parede, na mesma janela de meses, assim que o uso real dos clientes migrou de chat pontual pra agente autônomo de longa duração. Não é um problema que otimização de infraestrutura resolve com o tempo, porque o custo por token não é um bug — é o preço real de rodar o modelo. Enquanto o valor de uma ferramenta de código com IA estiver ligado a deixar o agente trabalhar mais tempo sem supervisão, a pressão vai continuar puxando pra medição por uso, não pra recuo ao plano fixo. "Ilimitado" nesse mercado tende a significar, cada vez mais, um número que ainda não foi testado por um usuário sério o suficiente.',
    },
  ],
}
