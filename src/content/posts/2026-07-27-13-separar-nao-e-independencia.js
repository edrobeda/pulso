export default {
  slug: 'separar-nao-e-independencia',
  title: 'Separar quem escreve do que revisa não é o mesmo que ter uma segunda opinião de verdade',
  excerpt:
    'A Qoder lançou uma camada de segurança que revisa código dentro da própria sessão de geração, com um agente diferente do que escreveu fazendo a checagem — reconhecendo, na prática, que agente não deveria revisar o próprio trabalho. Mas dois agentes da mesma linhagem não enxergam o problema com dois pontos de vista diferentes.',
  date: '2026-07-27',
  slot: '13:00',
  tags: ['Agentes', 'Segurança'],
  readTime: 5,
  blocks: [
    {
      type: 'p',
      text: 'Em 23 de julho a Qoder lançou o Qoder Security, uma camada que roda dentro da própria sessão de codificação: enquanto o agente escreve, um segundo processo revisa o que saiu e corrige antes do commit. O motivo declarado é um número publicado poucas semanas antes: um estudo que aplicou verificação em múltiplas camadas — teste funcional, análise estática, análise dinâmica com ASan/UBSan e model checking limitado — a 8.918 programas em C++ gerados por três modelos de peso aberto achou que código de IA dispara violação de runtime confirmada com o dobro da frequência de código escrito por humano, mesmo controlando por tamanho do código e taxa de aprovação nos testes.',
    },
    {
      type: 'h2',
      text: 'Um viés que a análise estática não pega',
    },
    {
      type: 'p',
      text: 'O detalhe mais incômodo desse estudo não é o "dobro" — é onde a diferença aparece e onde ela some. Rodando só análise estática, código de IA e código humano saem parecidos em segurança; a semelhança, segundo os autores, é artefato do tamanho do código, não segurança de verdade. É só quando a verificação desce pra análise dinâmica e prova formal de bound que a diferença real emerge. Isso importa porque a primeira camada do próprio Qoder Security — a que roda "sem latência e sem custo de modelo" — é exatamente varredura por padrão, o tipo de checagem que esse estudo mostrou não distinguir os dois casos. A camada mais barata é a que historicamente mais engana.',
    },
    {
      type: 'h2',
      text: 'Separar quem escreve de quem revisa',
    },
    {
      type: 'p',
      text: 'A parte arquitetural mais interessante do anúncio não é a checagem de padrão — é a decisão de separar o agente que gera o código do agente que revisa, explicitamente para evitar o que a própria empresa chama de "revisar o próprio trabalho". Depois de um bloco de código sair, um segundo agente faz revisão semântica — raciocina sobre a intenção, não só o padrão textual — atrás de injeção de SQL, execução remota de comando, exposição de dado sensível. E quando uma correção entra, uma nova varredura confere se ela não abriu outro buraco. Em teste interno antes do lançamento, o sistema achou mais de 600 problemas de segurança em projetos open source de produção; dentro da própria Qoder, comentário de segurança em revisão de código caiu entre 35% e 45% desde a adoção.',
    },
    {
      type: 'quote',
      text: 'A arquitetura separa quem escreve de quem revisa. Não separa o que os dois aprenderam sendo bom código.',
    },
    {
      type: 'h2',
      text: 'Separar o processo não é o mesmo que separar o viés',
    },
    {
      type: 'p',
      text: 'Um revisor humano sênior traz pra revisão algo que um segundo agente do mesmo tipo estrutural não traz automaticamente: uma trajetória de erros vividos, convenção aprendida em outro contexto, ceticismo formado por incidente real. Dois agentes de código, mesmo rodando em papéis diferentes dentro da mesma sessão, tendem a ter sido treinados sobre corpora sobrepostos, com noções parecidas do que "parece" código correto — e é justamente aí que mora o problema que o estudo de C++ expõe: o padrão que engana a análise estática engana os dois da mesma forma, porque os dois aprenderam a reconhecer "código seguro" pela mesma distribuição de exemplos. Ensemble reduz variância quando os membros erram de jeitos diferentes; quando os erros são correlacionados, dois agentes revisando um ao outro convergem pro mesmo ponto cego mais rápido do que corrigem o erro real. Os números que a Qoder divulgou — 600 problemas achados, 35-45% menos comentário de segurança — são medição própria de quem lança o produto, sem auditoria independente publicada; valem como indício de que a arquitetura ajuda, não como prova de que ela resolve a origem do problema. Mover a checagem pra dentro da sessão reduz a fila que represava revisão de PR — isso é ganho real. Mas presumir que dois agentes bastam pra ter uma segunda opinião de verdade é confundir separação de papel com independência de julgamento, e essas são coisas diferentes.',
    },
  ],
}
