export default {
  slug: 'tres-provas-um-veredito',
  title: 'O estudo que bateu ferramenta clínica aprovada tinha três provas de peso muito diferente — a manchete usou a mais fraca',
  excerpt:
    'A Nature Medicine publicou em 23/06 um estudo com três níveis de evidência bem diferentes entre si, e a peça mais frágil das três — um benchmark da própria OpenAI, autoavaliado — é a que mais aparece nas manchetes que resumem "IA generalista vence ferramenta clínica aprovada".',
  date: '2026-07-29',
  slot: '08:00',
  tags: ['Benchmarks', 'IA na Saúde'],
  readTime: 5,
  blocks: [
    {
      type: 'p',
      text: 'Em 23 de junho a Nature Medicine publicou um estudo comparando três modelos generalistas de fronteira — GPT-5.2, Gemini 3.1 Pro e Claude Opus 4.6 — contra duas ferramentas clínicas especializadas construídas sobre LLM, OpenEvidence e o UpToDate Expert AI da Wolters Kluwer. O resultado, resumido em quase toda cobertura que saiu depois: os três generalistas venceram as duas ferramentas especializadas em todo benchmark testado. É a manchete que circulou. O detalhe que quase nenhuma cobertura carrega junto é que "todo benchmark testado" eram três provas com pesos epistêmicos bem diferentes entre si, e a distinção importa mais do que o placar final.',
    },
    {
      type: 'h2',
      text: 'Três níveis, três formas de confiar no resultado',
    },
    {
      type: 'p',
      text: 'O desenho do estudo tinha três estágios. O primeiro, 500 questões do MedQA, é teste de conhecimento médico em formato de múltipla escolha — o tipo de benchmark fechado que já vem sendo questionado há tempo por risco de memorização, porque o conjunto de perguntas circula publicamente há anos. O segundo, 500 itens do HealthBench, mede alinhamento com o que clínicos considerariam uma resposta adequada — só que HealthBench é um benchmark construído e publicado pela própria OpenAI, com nota atribuída por outro modelo seguindo rubrica, não por revisão humana. O terceiro, batizado RCQ (real clinical queries), usou 100 perguntas reais e desidentificadas, feitas por médicos de verdade num ambiente clínico ao vivo, avaliadas às cegas por 12 clínicos humanos — produzindo 1.800 anotações modelo-questão no total. Das três pernas do estudo, essa é a única com juiz humano cego e pergunta real, não questão de prova nem nota atribuída por outro LLM.',
    },
    {
      type: 'quote',
      text: 'Os próprios autores tratam o RCQ, com juiz humano, como a evidência principal, e o HealthBench, autoavaliado, como complementar — mas é o HealthBench que aparece com mais frequência na crítica que a cobertura reproduz.',
    },
    {
      type: 'h2',
      text: 'A ferramenta especializada rebateu o pedaço certo',
    },
    {
      type: 'p',
      text: 'A OpenEvidence, uma das duas ferramentas clínicas que perderam no estudo, publicou uma resposta pública alegando conflito de interesse não revelado e falha metodológica: apontou que o HealthBench usa "métricas arbitrárias" de pontuação, que os próprios modelos de fronteira atuaram como juiz em parte da avaliação, e que as ferramentas clínicas não tiveram acesso de API equivalente ao dos modelos generalistas durante o teste, limitando o quanto conseguiam de fato mostrar. Do lado da defesa do estudo, a Dra. Sheila Bond, da Wolters Kluwer, argumentou que "ferramenta clínica não é desenhada pra vencer benchmark" — seu valor está em ancoragem em conteúdo médico confiável, governança e auditabilidade, não em nota de prova. O Dr. Jonathan Chen, de Stanford, resumiu a tensão real por trás da polêmica: escolher entre uma resposta ancorada em referência que dá pra checar e uma resposta empiricamente melhor pontuada mas sem lastro verificável. O Dr. Adam Rodman, de Harvard, reconheceu o valor do estudo mas apontou a mesma lacuna: qualidade de citação nunca foi avaliada, e o conjunto real de perguntas usado no RCQ continua oculto por razão de HIPAA — ninguém de fora consegue auditar diretamente o que foi perguntado.',
    },
    {
      type: 'p',
      text: 'Reparar em quem ataca o quê é revelador. Nenhuma das críticas publicadas mira diretamente o RCQ — a perna com clínico humano cego, sem modelo julgando modelo. A crítica de conflito de interesse e métrica arbitrária mira o HealthBench, que é exatamente a perna mais fraca: construída pela mesma empresa cujo modelo (GPT-5.2) mais se beneficia do resultado, com nota atribuída por outro LLM em vez de humano. É uma distinção que este blog já discutiu de outro ângulo — analisar em separado o mecanismo de contaminação de benchmark fechado não é o mesmo problema que ter o criador do teste também sendo quem tira a nota mais alta nele. Aqui os dois problemas coexistem no mesmo estudo, só que em pernas diferentes: uma tem o vício clássico de autoavaliação, a outra não.',
    },
    {
      type: 'h2',
      text: 'Nota de benchmark não é o mesmo tipo de garantia que aprovação regulatória',
    },
    {
      type: 'p',
      text: 'A leitura própria que vale tirar daqui não é sobre qual ferramenta é melhor — é sobre o tipo de confusão que a manchete "IA generalista vence ferramenta clínica aprovada" carrega embutida sem dizer. Uma ferramenta clínica que passou por processo de certificação regulatória carrega uma trilha de responsabilidade: alguém assina por ela, o status pode ser revogado se dano real aparecer, existe processo de auditoria contínua. Uma nota de benchmark — mesmo a perna mais rigorosa do estudo, com clínico humano cego — é uma fotografia pontual, tirada uma vez, sobre um conjunto fixo de perguntas, sem o mesmo tipo de responsabilidade contínua atrás dela. São dois tipos de garantia diferentes, e a cobertura que resume o estudo numa frase só empresta pro conjunto inteiro — inclusive a perna autoavaliada — o peso epistêmico que só a perna com juiz humano realmente ganhou.',
    },
    {
      type: 'p',
      text: 'O padrão que mais chama atenção aqui não é técnico, é editorial: um estudo com três níveis de prova bem diferentes entre si vira, na cobertura, um veredito único. Isso não é exclusivo de benchmark de saúde — é o mesmo achatamento que transforma qualquer resultado com nuance em manchete de placar. A diferença é que, em domínio de saúde, o achatamento tem consequência prática mais imediata: decisão de adoção clínica e argumento regulatório se apoiando na média de três provas quando só uma delas de fato sustenta o peso que está sendo colocado em cima.',
    },
  ],
}
