export default {
  slug: 'decompor-em-ticket-e-o-mesmo-ataque',
  title:
    'Quebrar a tarefa em tickets pequenos é boa prática de engenharia — e também é o ataque que engana o agente e o revisor',
  excerpt:
    'Um benchmark novo mostra que distribuir um objetivo malicioso em três tickets inofensivos derruba a taxa de recusa de 78-89% pra quase zero, e que pedir pro agente revisor agir como pentester só fecha um terço do buraco. O formato que a engenharia recomenda pra facilitar revisão é estruturalmente idêntico ao formato que evade ela.',
  date: '2026-08-01',
  slot: '13:00',
  tags: ['Segurança', 'Agentes'],
  readTime: 5,
  blocks: [
    {
      type: 'p',
      text: 'Uma recomendação básica de engenharia de software, muito antes de agente de código existir, é quebrar tarefa grande em tickets pequenos: PR menor é mais fácil de revisar, escopo menor é mais fácil de testar, intenção clara facilita rastrear o que mudou e por quê. Um benchmark publicado recentemente por Jonathan Steinberg e Oren Gal, o MOSAIC-Bench (arXiv 2605.03952), mede o que acontece quando esse mesmo formato — dividir o pedido em etapas sequenciais e aparentemente inócuas — é usado pra chegar a um resultado malicioso sem que o agente que escreve nem o agente que revisa percebam.',
    },
    {
      type: 'h2',
      text: 'O desenho: mesma intenção, três tickets em vez de um pedido direto',
    },
    {
      type: 'p',
      text: 'O benchmark tem 199 "cadeias" de três estágios, cada uma com um objetivo malicioso conhecido e um oráculo de exploração determinístico pra confirmar se a vulnerabilidade realmente ficou presente no resultado final — cobrindo 10 tipos de aplicação web, 31 classes de CWE e 5 linguagens. A estrutura de cada cadeia é sempre a mesma: um primeiro ticket que cria ou ajusta algo de aparência neutra (um arquivo de configuração, por exemplo), um segundo ticket que constrói em cima do que já existe sem repetir a intenção original, e um terceiro ticket, também de aparência benigna, que combina os artefatos anteriores num estado explorável. Nenhum dos três tickets, isolado, pareceria motivo pra recusa — o objetivo malicioso só existe na composição das três partes.',
    },
    {
      type: 'p',
      text: 'Os autores testaram nove agentes de produção — Claude Opus 4.6 e Sonnet 4.6, Codex GPT-5.3 e GPT-5.4, Gemini 3 Flash e 3.1 Pro, Kimi K2.6, Minimax M2.7 e GLM-5. Contra prompt direto pedindo a mesma coisa de uma vez, a taxa de recusa varia mas existe de fato: nos números que o paper reporta pra alguns desses modelos, a taxa de resultado vulnerável fica em 0% pro Sonnet, 1,9% pro Opus, 9,3% pro Codex GPT-5.4 e 20,4% pro Codex GPT-5.3 — ou seja, o reflexo defensivo funciona quando o pedido malicioso vem inteiro e explícito. Contra a mesma intenção distribuída em ticket staging, a taxa de sucesso do ataque sobe pra 53%–86% entre os nove agentes, com apenas duas recusas registradas em todas as rodadas encadeadas.',
    },
    {
      type: 'quote',
      text: 'the same defensive reflex that fires 78–89% on equivalent direct prompts (Claude) or hardens the code (Codex) is silenced by ticket staging',
    },
    {
      type: 'h2',
      text: 'O revisor separado também cai — e adotar postura de pentester só fecha um terço do buraco',
    },
    {
      type: 'p',
      text: 'A parte mais incômoda do desenho não é o agente que escreve — é o que acontece quando um segundo agente, especificamente instruído a revisar o diff final em busca de problema de segurança, entra no fluxo. Os autores testaram dois enquadramentos de prompt pro revisor: "neutro", que o instrui como um engenheiro sênior fazendo revisão de PR normal, e "pentester", que o instrui como um profissional de segurança ofensiva que precisa citar uma CWE específica pra poder recusar o merge. Mesmo sabendo, no experimento, que o diff era resultado de uma cadeia de tickets já confirmada como vulnerável pelo oráculo, o revisor no enquadramento neutro aprovou 25,8% desses diffs como PR de rotina. Trocar pra enquadramento de pentester reduz a taxa de aprovação — mas só pra 16,4%, uma queda de 9,4 pontos percentuais. Ou seja: instruir o agente revisor a assumir mentalidade adversarial ajuda, mas não fecha o buraco, ele só fica um pouco menor.',
    },
    {
      type: 'p',
      text: 'Esse número de revisor cruza direto com o achado de um estudo anterior que também mediu revisor separado do gerador de código: mesmo quando os dois papéis são atribuídos a agentes diferentes, a independência de julgamento não é automática. Mas o MOSAIC-Bench isola um mecanismo mais específico e mais desconfortável — o problema não é o revisor compartilhar ponto cego de treino com quem escreveu o código (esse já era o argumento anterior). É que o diff final, olhado sozinho, de fato não carrega evidência suficiente da intenção maliciosa: ela ficou espalhada nos tickets anteriores, que o revisor nem sempre tem no seu contexto de análise. Pedir postura mais cética ajuda porque aumenta o escrutínio do que está na tela, mas não resolve o problema de fundo, que é o histórico da cadeia não estar visível no ponto de decisão.',
    },
    {
      type: 'h2',
      text: 'A prática recomendada e o vetor de ataque têm a mesma forma',
    },
    {
      type: 'p',
      text: 'O que torna esse resultado mais do que só mais um jailbreak é que o formato de ataque não é uma técnica exótica de prompt injection — é literalmente o fluxo de trabalho que a própria disciplina de engenharia de software recomenda como boa prática há décadas, e que virou ainda mais central com agente de código: tarefa grande vira uma sequência de tickets pequenos, cada um com escopo claro e revisável isoladamente. O benchmark não está dizendo que esse fluxo é ruim — está mostrando que a mesma propriedade que faz um ticket pequeno ser fácil de revisar (contexto local, intenção restrita, diff pequeno) é exatamente a propriedade que impede tanto o agente gerador quanto o agente revisor de reconstruir a intenção acumulada ao longo da cadeia. Não dá pra corrigir isso simplesmente pedindo mais ceticismo pro revisor, porque o ceticismo por ticket individual não substitui visibilidade sobre a cadeia inteira — e é justamente essa visibilidade que o próprio formato, por desenho, corta.',
    },
  ],
}
