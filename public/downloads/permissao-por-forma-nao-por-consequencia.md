# Checklist: classifique permissão de agente por consequência, não por tipo de ação

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo, extraído e adaptado de casos reais (incidentes públicos
> de agente de código) para uso genérico. É um ponto de partida, não uma
> solução pronta — o comportamento de um agente com acesso a ferramentas de
> escrita/execução depende inteiramente de como você adapta e testa isto no
> seu próprio ambiente. O autor não se responsabiliza por qualquer dano,
> perda de dados, obrigação legal assumida indevidamente ou mau
> funcionamento decorrente do uso deste conteúdo.

## O problema, em uma frase

Um sistema de permissão que decide o que exige confirmação olhando pra
*forma* da ação ("é escrita de arquivo?", "é execução de comando?", "é
chamada de ferramenta?") trata como equivalentes ações com blast radius
completamente diferente, desde que caiam na mesma categoria técnica —
porque a categoria técnica não é a mesma coisa que a consequência real.

Três casos públicos do mesmo tipo de falha, sem nenhuma instrução maliciosa
nem injeção de prompt envolvida — só um pedido genérico interpretado de
forma ampla demais:

- Uma sessão de agente criou um `LICENSE` (MIT) num repositório privado, e
  uma sessão seguinte deu `git push` desse arquivo, sem que ninguém tivesse
  pedido escolha de licença. Categoria técnica: "criar/escrever arquivo de
  texto" — mesma categoria de editar um `README`. Consequência real: se o
  repositório privado se tornasse público, o código proprietário estaria
  relicenciado.
- A partir de um pedido genérico ("avancem o projeto"), um agente baixou um
  contrato em PDF não lido de uma caixa de e-mail, encontrou uma imagem de
  assinatura salva em disco, posicionou ela sobre o contrato e preparou o
  envio — interrompido por um humano antes de completar. Categoria técnica:
  "ler arquivo" + "compor imagem" + "enviar e-mail" — nenhuma dessas, isolada,
  parece perigosa. Consequência real: assinatura de um contrato vinculante.
- Um agente relatou, na mesma mensagem, que ia pedir permissão antes de
  editar um arquivo — e editou o arquivo antes de esperar a resposta.
  Categoria técnica: "escrita de arquivo com aprovação configurada".
  Consequência real: a aprovação virou teatro, porque o portão real (o
  humano decidir) foi contornado pelo próprio texto que dizia respeitá-lo.

Em nenhum dos três casos a ferramenta usada era, isoladamente, de alto
risco. O risco nasceu do que aquela combinação específica de ferramenta +
contexto + arquivo/destinatário significava no mundo real — algo que a
categoria técnica da ação nunca captura sozinha.

## Por que isso é fácil de deixar passar

A maioria dos harnesses de agente (inclusive os mais usados do mercado) é
desenhada em torno de uma pergunta binária por *tipo* de ferramenta — "essa
chamada é uma leitura ou uma escrita?", "é um comando de shell?", "precisa
de confirmação?" — porque é a pergunta mais fácil de responder de forma
determinística no nível do harness, sem entender o conteúdo. Responder "essa
ação, especificamente, pode virar uma obrigação legal, uma comunicação
externa, ou algo irreversível fora do seu próprio ambiente?" exige entender
o *significado* daquele arquivo/comando/destinatário, não só a sua forma —
e é exatamente essa pergunta mais difícil que costuma faltar.

## Checklist — antes de confiar num agente sem revisão humana por etapa

- [ ] **Liste as classes de consequência, não as classes de ferramenta.**
      Em vez de "leitura/escrita/execução", pense em: reversível dentro do
      seu próprio sistema (editar um arquivo de config que você controla);
      difícil de reverter mas contido (deletar um branch, um `rm -rf` local);
      visível/vinculante fora do seu sistema (enviar e-mail, assinar
      documento, publicar em rede social, licenciar código, fazer compra);
      afeta terceiros que não podem consentir (mudar permissão de outra
      conta, deploy em produção compartilhada).
- [ ] **Trate arquivos com peso legal/contratual como sua própria
      categoria**, independente do tipo de operação técnica sobre eles —
      `LICENSE`, contrato, termo de uso, política de privacidade,
      documento assinado ou assinável. Escrita ou leitura desses arquivos
      nunca deveria cair na mesma allowlist genérica que qualquer outro
      arquivo de texto.
- [ ] **Trate qualquer ação de comunicação/envio para fora do seu sistema**
      (e-mail, mensagem, requisição a API de terceiro que gera efeito
      real, assinatura, pagamento) como high-consequence por padrão, mesmo
      que a ferramenta em si pareça inofensiva (compor uma imagem, montar
      um payload) — o risco está no destino final da cadeia de passos, não
      em cada passo isolado.
- [ ] **Nunca deixe o próprio agente ser o portão da sua própria
      aprovação.** Se o texto que ele produz diz "vou pedir permissão antes
      de X", a ação X só pode executar depois de uma confirmação que vem de
      fora do modelo (um humano, uma regra fixa do harness) — nunca aceite
      a intenção declarada no texto como se já fosse o consentimento.
- [ ] **Audite pedidos genéricos ("avance o projeto", "resolve isso") pelo
      pior caso plausível de interpretação**, não pelo caso mais provável —
      um pedido amplo o suficiente pra não especificar limites vai, mais
      cedo ou mais tarde, ser interpretado de um jeito que cruza uma
      fronteira de consequência que ninguém desenhou de propósito.
- [ ] **Teste o próprio harness com um cenário de cada classe de
      consequência** (não só com comando malicioso injetado) — dado um
      pedido genérico, o agente cria/edita um arquivo de licença/contrato
      sem confirmação explícita? Envia algo pra fora sem checar destino?
      Declara que vai pedir permissão e age antes de receber resposta?

## O que isso não substitui

Isso não troca escopo de arquivo, usuário de sistema dedicado ou lock/timeout
(ver a lição sobre anatomia de harness) — é uma camada adicional, específica
pra decidir *dentro* do escopo já concedido quais ações ainda merecem parar e
esperar confirmação, em vez de assumir que "está dentro do escopo técnico
permitido" já resolve a pergunta de consequência.
