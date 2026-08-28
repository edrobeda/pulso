# Checklist: Dockerfile com COPY explícito e módulo novo

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de um caso real para uso genérico. Não
> foi testado no seu ambiente. Leia, entenda e adapte antes de usar. O autor
> não se responsabiliza por qualquer dano, perda de dados, indisponibilidade
> ou mau funcionamento decorrente do uso deste conteúdo — a responsabilidade
> de validar é sempre de quem executa.

## O problema que isso resolve

Um `Dockerfile` que lista explicitamente cada arquivo/pasta a copiar (em vez
de `COPY . .`) é mais previsível — a imagem final só contém o que foi
listado, sem lixo de build acidental. O preço é que ele não acompanha o
código sozinho: um módulo novo extraído do arquivo principal (ex.: uma
função movida de `server.js` para `lib/validation.js`, um `import` novo)
passa a existir no repositório e roda perfeitamente em ambiente local (onde
o interpretador só olha o sistema de arquivos real), mas a imagem Docker
segue sem esse arquivo até alguém lembrar de adicionar a linha `COPY`
correspondente. `docker build` não falha — build de imagem não verifica se
todo `import`/`require` do código tem um arquivo correspondente copiado, só
empacota o que foi mandado empacotar. O erro só aparece em runtime, quando o
processo tenta de fato carregar o módulo ausente (`ERR_MODULE_NOT_FOUND` em
Node/ESM, ou equivalente noutra linguagem) — e se isso acontece na
inicialização do servidor, a API inteira cai (502) até alguém notar e
corrigir.

## Por que isso escapa de checagens comuns

- **Funciona local**: sem Docker no caminho, o arquivo está ali de verdade.
- **`docker build` passa**: build só copia e empacota, não executa o app pra
  verificar imports.
- **Só quebra em runtime**, e só se o caminho de código que usa o módulo
  novo for de fato exercitado (ex.: se o módulo só é importado por uma rota
  específica, o container pode subir "saudável" e só cair quando alguém bate
  nessa rota).

## Checklist antes de considerar um refactor com módulo novo pronto

- [ ] Todo arquivo/pasta novo que o processo precisa em runtime (não só em
      build/teste) está numa linha `COPY` explícita do Dockerfile — ou o
      Dockerfile já usa um padrão que cobre automaticamente (`COPY . .`, ou
      `COPY src ./src` quando o módulo cai dentro de uma pasta já coberta).
- [ ] Depois de mudar o Dockerfile, faça o build da imagem **do zero** e
      rode o container **do zero** (não só `docker compose up -d` reaproveitando
      uma imagem antiga em cache) — o objetivo é simular exatamente o que vai
      rodar em produção.
- [ ] Depois do container subir, exercite de verdade o caminho de código que
      usa o módulo novo (uma chamada HTTP real, não só checar se o processo
      está de pé) — um container "healthy" ainda pode falhar na primeira
      requisição que toca o import ausente.
- [ ] Se o projeto tem CI de build de imagem, prefira que ele rode o mesmo
      Dockerfile de produção (não um ambiente que pula a etapa de COPY) —
      senão o CI passa e a produção quebra do mesmo jeito.

## Lição por trás disso

Um Dockerfile com COPY explícito é uma lista manual de arquivos que precisa
ser mantida em sincronia com o código real — e nada avisa quando ela fica
desatualizada, exceto o processo falhando ao tentar carregar o que falta.
Tratar "o build passou" como sinônimo de "a imagem está completa" é o mesmo
erro, em outra camada, de tratar "HTTP 200" como sinônimo de "a página
funciona": build/transporte validam uma etapa mecânica, não o comportamento
real do processo rodando.
