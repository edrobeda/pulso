export default {
  slug: 'swe-bench-morreu-e-ainda-e-citado',
  title: 'O benchmark que todo mundo cita pra provar que agente de código funciona foi abandonado em fevereiro',
  excerpt:
    'A OpenAI parou de reportar SWE-bench Verified depois de confirmar que modelos reproduzem o patch-gabarito palavra por palavra só com o ID da tarefa. O número que sobra pra medir capacidade real é bem menor que os 80% do placar.',
  date: '2026-07-26',
  slot: '13:00',
  tags: ['Agentes', 'Avaliação'],
  readTime: 5,
  blocks: [
    {
      type: 'p',
      text: 'Todo lançamento de modelo em 2026 vinha com o mesmo slide: pontuação em SWE-bench Verified, os concorrentes logo abaixo, a barra crescendo geração após geração. Claude Opus e Gemini trocando o topo do placar perto de 80,9%. Era o número mais citado da indústria pra dizer "este agente resolve problema de verdade em codebase real". Em fevereiro deste ano a OpenAI, uma das empresas que mais se beneficiou desse número, publicou uma análise dizendo que ia parar de reportá-lo — porque descobriu que ele já não media o que dizia medir.',
    },
    {
      type: 'h2',
      text: 'O teste era: dá pra reproduzir a resposta só com o ID?',
    },
    {
      type: 'p',
      text: 'A auditoria confirmou experimentalmente que GPT-5.2, recebendo só uma frase de descrição da tarefa, reproduzia o patch-gabarito quase palavra por palavra — incluindo a condicional exata de uma correção de autenticação Django. Claude Opus 4.5 citou de memória um comentário inline de um patch que, em tese, nunca tinha visto. Gemini 3 Flash, recebendo apenas o ID da tarefa — nenhuma descrição, nenhum código —, devolveu o diff unificado completo com os números de linha corretos. Isso não é o modelo raciocinando sobre o problema. É o modelo citando um exame que já tinha decorado, porque esse exame — e sua resposta certa — vazou pro material de treino há muito tempo.',
    },
    {
      type: 'quote',
      text: 'Um modelo que recita o gabarito ao ouvir só o número da questão não está sendo avaliado. Está sendo consultado.',
    },
    {
      type: 'p',
      text: 'E a contaminação não foi o único problema que a auditoria encontrou. Ao reexaminar os casos em que os modelos falhavam, a OpenAI achou que 59% das tarefas reprovadas tinham testes fundamentalmente quebrados — o critério de correção do próprio benchmark estava errado, não o código gerado. Um placar que ao mesmo tempo vaza a resposta certa pros casos fáceis e usa critério inválido pra boa parte dos casos difíceis não é um placar carregando ruído aceitável. É um placar que parou de ter relação confiável com a pergunta que deveria responder.',
    },
    {
      type: 'h2',
      text: 'O problema não é só a pergunta ter vazado',
    },
    {
      type: 'p',
      text: 'Tem um segundo defeito, mais estrutural, que um paper de junho descreve bem: benchmark de agente de código mistura numa única nota o modelo, o harness em volta dele, o ambiente de execução e o critério de avaliação. Um agente na prática não é um modelo — é um sistema composto, e qualquer peça desse sistema pode mover o placar por uma margem comparável à diferença entre duas gerações inteiras de modelo. Quando o placar sobe, a pergunta "o que exatamente melhorou?" não tem resposta a partir do número sozinho. Pode ter sido o modelo. Pode ter sido o harness que envolve ele, ajustado especificamente pra passar mais casos daquele benchmark específico. São coisas diferentes pra quem decide o que rodar em produção, e o placar único não distingue uma da outra.',
    },
    {
      type: 'p',
      text: 'O número que sobra quando alguém mede o que interessa de verdade é bem menos bonito. Taxas de aceitação de pull request em codebase de produção real — o que um revisor humano de fato aprova, não o que passa num teste isolado com gabarito conhecido — ficam estimadas entre 35% e 50% pros agentes mais fortes do mercado, bem abaixo dos 80% que o placar contaminado anunciava. A diferença não é ruído de medição. É a distância entre resolver um problema de exame já visto e resolver um problema novo dentro de um código com convenção implícita, dependência viva e um revisor que espera coerência com o resto do sistema.',
    },
    {
      type: 'p',
      text: 'Vale notar o que não mudou: a resposta institucional ao benchmark furado não foi parar de publicar número nenhum — foi trocar de benchmark. TerminalBench e variantes ganharam tração exatamente por serem mais difíceis de decorar, com pontuação de frontier ainda na casa dos 50-58%. É um progresso real, mas também é a mesma dinâmica de sempre: o mercado precisa de um número pra vender, então qualquer benchmark que vira padrão vira, cedo ou tarde, alvo de otimização — e otimizar pro número nunca foi garantidamente o mesmo que otimizar pra capacidade real. A pergunta que vale fazer diante de qualquer claim de "resolve X% dos problemas" não é mais só "qual foi o placar", é "esse placar ainda mede alguma coisa, ou já virou a pergunta de prova que todo mundo colou".',
    },
  ],
}
