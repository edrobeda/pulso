export default {
  slug: 'gargalo-mudou-de-fila',
  title: 'Agente escreve código mais rápido, mas o time não entrega mais rápido — o gargalo só mudou de fila',
  excerpt:
    'Dados de 2026 sobre milhões de PRs mostram devs se sentindo 20% mais rápidos e sendo, na prática, 19% mais lentos. O código sai mais rápido da esteira; a fila que estava vazia era a de revisão, não a de escrita.',
  date: '2026-07-26',
  slot: '08:00',
  tags: ['Engenharia', 'Produtividade'],
  readTime: 5,
  blocks: [
    {
      type: 'p',
      text: 'A promessa de vender agente de código pra time de engenharia sempre foi a mesma: você vai entregar mais rápido. E na medida individual isso é verdade — a LinearB mediu, num levantamento de 2026 sobre 8,1 milhões de pull requests em mais de 4.800 organizações, que devs usando agente completam 21% mais tarefas e fazem merge de 98% mais PRs. O problema é o que acontece um passo depois disso: o tempo de revisão desses PRs subiu 91%. Na sensação subjetiva, os times relataram estar 20% mais rápidos. Na métrica de entrega real — o que efetivamente chega ao branch principal — estavam 19% mais lentos.',
    },
    {
      type: 'h2',
      text: 'A fila não some, ela troca de lugar',
    },
    {
      type: 'p',
      text: 'A CircleCI chegou num número parecido por outro caminho: throughput de feature branch subiu 59% ano a ano, mas o throughput de branch principal do time mediano de fato caiu. PRs assistidos por IA no percentil 75 saem 2,6 vezes maiores — 408 linhas contra 157 de um PR sem IA — e esperam 5,3 vezes mais tempo pra um revisor humano sequer olhar: 1.055 minutos contra 201. Não é uma fila que ficou mais devagar por acidente. É uma fila que sempre teve esse tamanho de gargalo, só que antes ele nunca enchia, porque a esteira de escrever código era lenta o suficiente pra nunca sobrecarregar quem revisa.',
    },
    {
      type: 'quote',
      text: 'O gargalo não desapareceu quando o agente passou a escrever o código. Ele só deixou de estar na etapa que todo mundo estava otimizando.',
    },
    {
      type: 'h2',
      text: 'Isso já tinha nome antes de existir agente',
    },
    {
      type: 'p',
      text: 'A Teoria das Restrições, formalizada por Eliyahu Goldratt ainda nos anos 80 pra linha de produção industrial, tem uma regra que qualquer engenheiro de processo conhece: o throughput de um sistema inteiro é limitado pela etapa mais lenta dele, e acelerar qualquer etapa que não seja essa não aumenta a entrega — só empilha inventário na frente do gargalo real. Trocar "linha de produção" por "pipeline de engenharia de software" e "peça semi-acabada" por "pull request" descreve exatamente o que os números de 2026 estão mostrando. A geração de código nunca foi o gargalo de um time de software adulto — a capacidade de revisar com atenção sempre foi menor que a capacidade de escrever. Só que por décadas essa diferença não incomodava, porque nenhuma das duas etapas crescia rápido o suficiente pra expor a outra.',
    },
    {
      type: 'p',
      text: 'Agente de código destravou só a etapa de escrita, e destravou rápido. O resultado é o inventário se acumulando exatamente onde a teoria prevê: 85% dos times de engenharia hoje apontam revisão de código como o principal gargalo depois de adotar agente — não porque revisão piorou, mas porque agora ela precisa dar conta de um volume que nunca precisou absorver antes.',
    },
    {
      type: 'h2',
      text: 'A fila também não está parada — está piorando',
    },
    {
      type: 'p',
      text: 'E aqui a analogia da linha de produção fica incompleta, porque peça parada numa esteira não apodrece. Código parado numa fila de revisão, sim: a LinearB também mediu que código gerado por IA carrega 1,7 vez mais problemas por PR que código escrito por humano, e que dívida técnica sobe entre 30% e 41% depois da adoção dessas ferramentas. Mais de 15% dos commits assistidos por IA introduzem pelo menos um problema, e o volume acumulado de problemas introduzidos por IA que ainda sobrevivem no código passou de 110 mil até fevereiro de 2026. Enquanto o PR espera 1.055 minutos por um revisor, ele não está só ocupando espaço — está sendo a base sobre a qual o próximo PR, também gerado por agente, vai ser escrito.',
    },
    {
      type: 'p',
      text: 'A resposta que o mercado está dando pra esse gargalo é reforçar a mesma etapa com mais agente: o GitHub Copilot já processou mais de 60 milhões de revisões de código, um volume que multiplicou por dez em menos de um ano, e mais de um em cada cinco reviews no GitHub hoje envolve um agente revisando. É uma solução razoável pro volume — nenhum time vai contratar dez revisores humanos pra acompanhar o ritmo de dez agentes escrevendo. Mas resolve o gargalo de throughput trocando-o por um gargalo de confiança: um agente revisando código escrito por outro agente, dentro de uma categoria de erro onde entre 40% e 45% do código gerado por IA carrega alguma vulnerabilidade mapeada no OWASP Top 10 — e no caso de Java essa taxa passa de 70% —, não é o mesmo tipo de verificação que um revisor sênior fazia quando o volume era menor.',
    },
    {
      type: 'p',
      text: 'A métrica que a indústria mais gosta de publicar — quantas tarefas o agente completou, quantos PRs foram gerados, quanto código saiu — mede a etapa que já não é o gargalo há algum tempo. O número que importa é o que acontece na etapa de trás: quanto desse volume chega ao branch principal revisado de verdade, e não só revisado rápido o suficiente pra não travar a fila.',
    },
  ],
}
