export default {
  slug: 'telefone-sem-fio-da-vaga-junior',
  title:
    'O mesmo estudo de Harvard sobre vaga júnior virou 7%, 10% e 80% — dependendo de quem cita, não do que o paper mede',
  excerpt:
    'Um paper de Harvard sobre emprego júnior em empresas que adotam IA generativa mede queda de 7% a 10% em seis trimestres. Na Forbes e numa fileira de blogs, o mesmo estudo virou "80% por trimestre" — um número que, levado a sério, zeraria a contratação júnior em menos de um ano.',
  date: '2026-07-30',
  slot: '08:00',
  tags: ['Mercado de Trabalho', 'Fontes Primárias'],
  readTime: 5,
  blocks: [
    {
      type: 'p',
      text: 'Em maio deste ano a Forbes publicou uma coluna com uma frase direta: "em empresas que adotaram IA generativa, a contratação de nível júnior caiu cerca de 80% por trimestre desde 2023, segundo um novo working paper de Harvard". A frase circulou, virou manchete em outros veículos, e alimentou uma safra de posts de blog sobre "extinção do desenvolvedor júnior" citando números de 67%, 73% e 78%. O problema é que nenhum desses números aparece no paper que estão citando. O paper existe, é sério, e mede uma coisa real — só que o número que ele reporta é bem menor, e o mecanismo pelo qual virou "80% por trimestre" é mais interessante que a própria estatística.',
    },
    {
      type: 'h2',
      text: 'O que o paper mede de verdade',
    },
    {
      type: 'p',
      text: 'O estudo é "Generative AI as Seniority-Biased Technological Change: Evidence from U.S. Résumé and Job Posting Data", de Seyed Mahdi Hosseini Maasoum e Guy Lichtinger (SSRN 5425555, publicado em agosto de 2025, com revisão em outubro). Os autores usam uma base da Revelio Labs com histórico de emprego de 62 milhões de trabalhadores em 285 mil empresas americanas, de 2015 a 2025, e identificam adoção de IA generativa por empresa rastreando quando ela começa a publicar vaga de "GenAI integrator". Com isso montam um desenho de diferença-em-diferenças comparando emprego júnior em empresas adotantes contra não adotantes, controlando por emprego sênior na mesma empresa. O resultado: a partir do primeiro trimestre de 2023, emprego júnior cai entre 7,7% e cerca de 10% em relação a empresas não adotantes, seis trimestres depois da adoção — puxado por contratação mais lenta, não por demissão nem por promoção acelerada dos juniores já dentro de casa. Um setor foge do padrão geral: em atacado e varejo a queda chega a cerca de 40% menos contratação júnior, mas os próprios autores tratam isso como exceção setorial, não como o número do estudo inteiro.',
    },
    {
      type: 'h2',
      text: 'De onde vem o 80%',
    },
    {
      type: 'quote',
      text: 'At companies that have adopted generative AI, entry-level hiring has fallen by roughly 80% per quarter since 2023, according to a new working paper from Harvard University.',
    },
    {
      type: 'p',
      text: 'Essa é a frase exata da coluna da Forbes que citou o mesmo paper. Ela não bate com nenhuma leitura do texto original — nem a mais alta (10%), nem a exceção setorial (40%) — e tem um problema à parte, que é interno à própria frase: uma queda composta de 80% por trimestre, sustentada desde 2023, levaria a contratação júnior a uma fração estatisticamente nula do nível original em pouco mais de um ano. Não é o que o mercado de trabalho mostra, não é o que a própria Forbes descreve em outras colunas do mesmo mês sobre o tema, e não é uma leitura defensável de um coeficiente de diferença-em-diferenças que os autores relatam na casa de um dígito. A explicação mais provável é a mais chata: alguém leu "queda de cerca de 10 pontos percentuais acumulada até o sexto trimestre" e escreveu "80% por trimestre", talvez confundindo com a exceção setorial de 40% multiplicada por algum fator de composição que não existe no paper. Depois disso, blogs de SEO — byteiota, hakia e outros do mesmo gênero — republicaram a ideia geral ("Harvard encontrou colapso de contratação júnior") com números próprios, 67%, 73%, 78%, sem link pro paper e sem citar de onde tiraram o dígito específico.',
    },
    {
      type: 'h2',
      text: 'Três métricas diferentes empilhadas numa manchete só',
    },
    {
      type: 'p',
      text: 'Parte da confusão vem de misturar três medidas que respondem perguntas diferentes. A primeira é vaga anunciada: o número de 67% de queda em postagem de vaga júnior de tecnologia que aparece repetido em vários desses blogs mede intenção de contratar, não contratação de fato — e nenhuma das buscas que fiz encontrou uma fonte primária rastreável pra esse número específico, só blog citando blog citando "análise". A segunda é o próprio paper de Hosseini Maasoum e Lichtinger, baseado em currículo — mede emprego realizado, e encontra 7% a 10%. A terceira é um paper independente, "Canaries in the Coal Mine? Six Facts about the Recent Employment Effects of Artificial Intelligence", de Erik Brynjolfsson, Bharat Chandar e Ruyu Chen, do Stanford Digital Economy Lab, que usa uma base completamente diferente — dados de folha de pagamento da ADP — e mede que trabalhadores de 22 a 25 anos nas ocupações mais expostas a IA generativa tiveram queda relativa de 16% no emprego. Vaga anunciada, currículo e folha de pagamento são três sinais legítimos, mas não são a mesma coisa, e tratar os três como um único "X% de queda" é o tipo exato de achatamento que confunde intenção de contratar com pessoa efetivamente empregada.',
    },
    {
      type: 'p',
      text: 'O que vale notar aqui não é que "os números de IA matando vaga júnior são exagero" — o oposto: duas equipes de pesquisa, usando bases de dados diferentes (currículo via Revelio de um lado, folha de pagamento via ADP do outro) e metodologias diferentes, chegaram independentemente a uma faixa parecida, de 7% a 16% de queda relativa no emprego júnior em empresas ou ocupações mais expostas a IA generativa. Essa convergência entre duas identificações causais independentes é o achado que deveria estar na manchete — é raro, é sólido, e é modesto o suficiente pra ser plausível. O que a cadeia de citação fez foi descartar justamente essa parte: pegou o número mais chato e mais bem sustentado do debate inteiro e trocou por uma cifra oito vezes maior, sem fonte rastreável, que nenhum dos dois papers originais sustenta — e essa cifra inflada, não o achado real, é o que hoje aparece quando alguém pesquisa "Harvard" e "vaga júnior" na mesma frase.',
    },
  ],
}
