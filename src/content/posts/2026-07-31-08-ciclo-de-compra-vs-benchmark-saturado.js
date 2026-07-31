export default {
  slug: 'ciclo-de-compra-vs-benchmark-saturado',
  title:
    'Sete modelos em sete dias: o ciclo de escolher modelo caiu de seis meses pra quatro semanas — e o benchmark parou de separar os dois melhores',
  excerpt:
    'Entre 17 e 23 de julho, cinco laboratórios lançaram sete modelos. O relatório trimestral de cadência mostra o ciclo de decisão de qual modelo usar caindo de seis meses (2024) pra quatro semanas — bem na hora em que MMLU e GPQA Diamond pararam de diferenciar os modelos de ponta.',
  date: '2026-07-31',
  slot: '08:00',
  tags: ['Benchmarks', 'Mercado de IA'],
  readTime: 5,
  blocks: [
    {
      type: 'p',
      text: 'Entre 17 e 23 de julho deste ano, cinco laboratórios lançaram sete modelos: Kimi K3 da Moonshot (17/07), Qwen3.8-Max-Preview e mais dois lançamentos da Alibaba num intervalo de 72 horas, um trio Gemini 3.6 Flash do Google, o Laguna S 2.1 de código aberto da poolside, e o Ling-3.0-flash da Ant Group fechando a semana em 23/07. Um relatório do setor sobre essa semana resume o problema com uma frase seca: "ninguém consegue avaliar sete modelos em sete dias". Não é reclamação de quem está atolado de leitura — é a descrição de um limite estrutural que vale a pena separar em duas partes, porque cada uma piora a outra.',
    },
    {
      type: 'h2',
      text: 'A primeira parte: o ciclo de decisão encolheu',
    },
    {
      type: 'p',
      text: 'Um índice trimestral de cadência de lançamento do mesmo veículo dá números pra essa aceleração. O ritmo de lançamentos substantivos dobrou no primeiro trimestre de 2026 frente ao quarto trimestre de 2025 — de cerca de 6 pra mais de 12 no trimestre — e a projeção pro segundo trimestre gira em torno de 14 a 18 lançamentos, cerca de 1,3 por semana no cenário-base. A Alibaba sozinha manteve um lançamento substantivo a cada 10 dias, aproximadamente. O relatório marca uma janela específica, de 10 a 23 de março, com cinco laboratórios lançando simultaneamente, como o ponto em que a cadência virou de mensal pra semanal. O efeito prático nas equipes que decidem qual modelo usar em produção: o ciclo de avaliação e troca de fornecedor, que girava em torno de seis meses em 2024, está em quatro semanas agora.',
    },
    {
      type: 'h2',
      text: 'A segunda parte: o benchmark parou de separar',
    },
    {
      type: 'p',
      text: 'Isso seria só uma questão de correr mais rápido se o instrumento de medição continuasse confiável. Não está. MMLU foi o primeiro benchmark generalista a saturar, com os modelos de fronteira aglomerados acima de 88-90% de acerto — faixa em que a diferença entre o primeiro e o quinto colocado deixa de ser estatisticamente distinguível do ruído de amostragem. MMLU-Pro e GPQA Diamond estão seguindo a mesma trajetória de saturação, alguns em prazo ainda mais curto que os um a dois anos que MMLU e GPQA levaram. Isso significa que, no exato momento em que o mercado pede decisões mais rápidas — quatro semanas em vez de seis meses —, os números que sustentariam essa decisão de forma objetiva estão perdendo justamente a capacidade de dizer qual dos dois modelos recém-lançados é melhor.',
    },
    {
      type: 'quote',
      text: 'Contínuo acesso à IA significa possuir um processo que metaboliza lançamentos mais rápido do que fornecedores conseguem enviá-los.',
    },
    {
      type: 'p',
      text: 'É a conclusão prática do mesmo relatório sobre a semana de sete lançamentos, e a resposta que propõe não é ler mais rápido — é um filtro fixo de trinta minutos por semana com três perguntas: o modelo está disponível hoje (não em waitlist), foi medido por alguém fora do próprio laboratório que o construiu, e é melhor que o que já está em produção pra carga de trabalho real que a equipe roda. Note o que essa terceira pergunta faz: ela substitui "qual pontuou mais alto no benchmark" por "qual funciona melhor no meu caso", justamente porque a primeira pergunta parou de ter uma resposta confiável.',
    },
    {
      type: 'h2',
      text: 'O que isso desloca, na prática',
    },
    {
      type: 'p',
      text: 'A leitura que vale tirar daqui não é "os benchmarks são inúteis" — é mais específica que isso. Quando um conjunto de números para de diferenciar as opções no topo, a decisão de qual delas usar não desaparece: ela migra pra outro critério, silenciosamente, sem que ninguém anuncie a mudança de regra. Se GPT-5.6 Sol, Kimi K3 e Gemini 3.6 Flash empatam dentro da margem de erro em MMLU-Pro e GPQA Diamond, a escolha de qual usar em produção deixa de ser sobre capacidade medida e passa a ser sobre o que já está integrado no pipeline, qual API já tem chave configurada, qual tem o SLA de latência mais previsível — critérios legítimos, mas que não são o que o benchmark prometia entregar quando a indústria inteira começou a citá-lo como prova de qualidade. Uma tentativa acadêmica recente de consertar isso — o paper "The Growing Pains of Frontier Models", de Adil Amin, publicado em maio — propõe decompor o placar num componente de correlação entre capacidades e um resíduo por versão, pra diferenciar ganho real de pré-treino de ajuste cosmético de pós-treino. É um instrumento mais fino, mas ainda não é o que roda no dia a dia de nenhuma equipe que precisa decidir hoje qual modelo chamar pela API. Enquanto isso, o filtro de três perguntas de trinta minutos por semana continua sendo, na prática, o instrumento real — e ele mede triagem de custo e disponibilidade, não capacidade.',
    },
  ],
}
