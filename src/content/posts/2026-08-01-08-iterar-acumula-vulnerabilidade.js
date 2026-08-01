export default {
  slug: 'iterar-acumula-vulnerabilidade',
  title:
    'Cada rodada de "melhorar o código" também é uma rodada de adicionar vulnerabilidade',
  excerpt:
    'Um estudo controlado isolou o mecanismo: pedir pro agente refinar o código gera mais falha crítica a cada iteração, mesmo quando o pedido explícito é "deixa mais seguro". E o relatório da indústria bate no mesmo lugar — dois anos seguidos com a taxa de segurança travada perto de 56%, apesar do salto de capacidade dos modelos.',
  date: '2026-08-01',
  slot: '08:00',
  tags: ['Segurança', 'Ferramentas de Código'],
  readTime: 5,
  blocks: [
    {
      type: 'p',
      text: 'O modo agente de codar vende a si mesmo como um loop: o agente escreve, roda o teste, lê o erro, ajusta, roda de novo, até o pipeline ficar verde. É o argumento de venda de praticamente toda ferramenta agêntica de código lançada em 2026. Duas publicações desta semana, sem relação uma com a outra, medem esse exato loop pelo lado da segurança — uma em laboratório controlado, outra em escala de indústria — e as duas chegam no mesmo lugar: iterar não deixa o código mais seguro, deixa mais vulnerável.',
    },
    {
      type: 'h2',
      text: 'O placar que não anda',
    },
    {
      type: 'p',
      text: 'A Veracode publicou em 28 de julho seu relatório anual GenAI Code Security, que testa mais de 100 modelos sob condição padronizada, sem instrução de segurança no prompt. A taxa média de aprovação em teste de segurança ficou em 56% — praticamente igual aos 55% do relatório anterior, no quarto snapshot seguido sem movimento relevante. O contraste que o relatório destaca é o que importa: a taxa de sintaxe correta está perto de 100% em modelo moderno, mas cerca de 44% das tarefas de geração introduzem uma vulnerabilidade classificada no OWASP Top 10. O modelo líder do ano, GPT-5.5, chegou a 68%; seis dos modelos testados ficaram agrupados entre 50% e 53%, sem diferença relevante entre modelo genérico e modelo vendido como especializado em código. A distribuição por tipo de falha escancara onde o problema se concentra: 87% de aprovação em uso de algoritmo criptográfico, 83% em SQL injection — mas 15% em cross-site scripting e 12% em log injection, categorias em que o modelo erra a maioria absoluta das vezes.',
    },
    {
      type: 'quote',
      text: 'models may be almost syntactically perfect, but they are still failing on nearly half of all tasks where security is needed',
    },
    {
      type: 'p',
      text: 'A frase é de Chris Wysopal, cofundador e chief security evangelist da Veracode, no anúncio do relatório. O ponto dele é o mesmo que o relatório documenta com número: o eixo em que os modelos mais avançaram nos últimos dois anos — gerar código que compila e passa em teste funcional — não é o mesmo eixo da segurança, e não puxa esse segundo eixo junto por arrasto.',
    },
    {
      type: 'h2',
      text: 'O experimento que isola o mecanismo',
    },
    {
      type: 'p',
      text: 'O relatório da Veracode mede o resultado final de uma geração; não diz o que acontece dentro de uma sessão de várias rodadas. Quem mediu isso foi um estudo de Shivani Shukla (University of San Francisco), Himanshu Joshi (Vector Institute for AI) e Romilla Syed (University of Massachusetts Boston), publicado no IEEE ISTAS 2026 e disponível como arXiv 2506.11022. O desenho é simples: 400 amostras de código, cada uma levada por 10 rodadas de "melhoria" pedida ao modelo, sob quatro estratégias de prompt diferentes — foco em eficiência, foco em funcionalidade nova, foco explícito em segurança, e pedido ambíguo de "melhorar" sem direção. A cada rodada, os autores mediram vulnerabilidade introduzida.',
    },
    {
      type: 'p',
      text: 'O crescimento não é linear nem pequeno: média de 2,1 vulnerabilidades por amostra nas rodadas 1-2, subindo pra 4,7 nas rodadas 3-7, e 6,2 nas rodadas 8-10. Vulnerabilidade crítica sobe 37,6% já depois de cinco iterações. Os autores encontram uma correlação de 0,64 entre crescimento de complexidade do código e vulnerabilidade nova introduzida — a cada 10% de aumento de complexidade, 14,3% mais vulnerabilidade. E o dado que mais furou a expectativa: mesmo a estratégia com foco explícito em segurança, que produziu o menor total entre as quatro (38 vulnerabilidades contra 158 da estratégia de funcionalidade), não ficou em zero. Ela trocou falha de criptografia fraca por uso incorreto de biblioteca de criptografia "melhor", camada de complexidade desnecessária e padrão de segurança desatualizado que o modelo tratava como boa prática.',
    },
    {
      type: 'h2',
      text: 'Pedir mais segurança não neutraliza o mecanismo, só muda a classe da falha',
    },
    {
      type: 'p',
      text: 'Esse último achado é o que separa o estudo de um resultado óbvio do tipo "IA sem instrução de segurança erra mais". Instruir o modelo pra corrigir segurança de fato reduz o volume — 38 é bem menos que 158 — mas não reduz a vulnerabilidade a zero, porque o mecanismo que os autores descrevem não é falta de instrução: é o modelo carecer do julgamento contextual pra reconhecer que uma correção "mais sofisticada" pode trocar um risco conhecido por outro que ele não tem como avaliar. Os autores chamam isso de ilusão de melhoria — o código parece mais robusto a cada rodada, o que reforça a confiança de quem está revisando por cima, exatamente enquanto a superfície de falha continua crescendo por baixo.',
    },
    {
      type: 'p',
      text: 'Juntando os dois lados: a Veracode mede o resultado agregado de um ano de evolução de modelo parado no mesmo patamar de segurança apesar do salto de capacidade; o estudo de iteração mede o mecanismo específico que explica por que escalar capacidade sozinho não deveria bastar pra resolver isso. Não é que o modelo ainda não aprendeu a escrever código seguro — é que o loop de "escrever, testar, ajustar, repetir", que é a própria unidade de trabalho do modo agente, tem acúmulo de vulnerabilidade embutido na sua mecânica, e pedir segurança explicitamente no prompt ameniza mas não desliga esse acúmulo. Ferramenta agêntica de código roda esse loop dezenas de vezes numa sessão só, sem checkpoint de revisão humana entre uma rodada e outra — é exatamente a condição que os dois estudos, cada um do seu jeito, mostram não ser neutra.',
    },
  ],
}
