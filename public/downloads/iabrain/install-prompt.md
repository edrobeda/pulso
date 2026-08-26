# Prompt de instalação/atualização automática — iaBrain

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo. Colar este texto na sessão de um agente de IA faz com
> que ele baixe arquivos da internet e escreva no seu projeto de forma
> autônoma — revise o resultado antes de commitar, e nunca rode isso com
> permissões amplas (modo que pula confirmações) sem antes ter testado o
> processo pelo menos uma vez com revisão manual. O autor não se
> responsabiliza por qualquer dano, perda de dados ou mau funcionamento
> decorrente do uso deste conteúdo — a responsabilidade de revisar o que
> foi instalado é sempre de quem executa.

## Como usar

Cole o bloco abaixo (a partir de "Você vai instalar...") como mensagem
pro seu agente de IA (Claude Code, OpenCode, ou qualquer harness que
consiga buscar uma URL e escrever arquivo local). Funciona tanto pra
primeira instalação quanto pra checar/aplicar uma atualização — o próprio
prompt decide qual dos dois casos se aplica.

---

Você vai instalar ou atualizar o kit **iaBrain** neste projeto. Siga
exatamente esta sequência, na ordem, e não pule nenhum passo de
verificação:

1. **Descubra a versão mais recente.** Busque
   `https://blog.eventifylab.com/downloads/iabrain/latest.json`. Leia
   `latest_version`, `manifest_url` e `changelog_url` da resposta.

2. **Descubra a versão já instalada (se houver).** Procure um arquivo
   `iabrain/INSTALLED_VERSION` na raiz deste projeto. Se existir, essa é a
   versão atualmente instalada. Se não existir, trate como instalação
   nova (nenhuma versão instalada ainda).

3. **Compare as versões.**
   - Se a versão instalada já é igual à mais recente: informe isso ao
     usuário ("iaBrain já está atualizado, versão X") e **pare aqui**, não
     baixe nada de novo.
   - Se não há versão instalada, ou a instalada é mais antiga: continue.

4. **Busque o manifesto da versão nova**: a URL está em `manifest_url`
   (do passo 1). Leia a lista `files` — cada item tem `file` (nome do
   arquivo), `role` e, quando existir, `suggested_target` (onde esse
   arquivo tende a se encaixar em cada harness — é uma sugestão, não uma
   instrução pra copiar automaticamente pra lá, ver passo 7).

5. **Baixe cada arquivo listado no manifesto** de `base_url + file` pra
   `iabrain/v<versão>/<file>` neste projeto (crie o diretório se não
   existir). Não sobrescreva uma pasta de versão que já existe — se
   `iabrain/v<versão>/` já existir com conteúdo, pare e avise o usuário em
   vez de sobrescrever silenciosamente.

6. **Busque o changelog** (`changelog_url` do passo 1) e mostre ao usuário
   um resumo das entradas mais novas que a versão anteriormente instalada
   (ou o changelog inteiro, se for instalação nova). Não decida sozinho
   que mudanças "aplicar" — o changelog é informativo, quem decide o que
   fazer com cada mudança é o usuário.

7. **Não integre automaticamente aos arquivos do harness** (não edite
   `CLAUDE.md`, não crie arquivo em pasta de agentes/skills, não toque em
   nada fora de `iabrain/v<versão>/`) sem perguntar antes. Depois de
   baixar, liste pro usuário, um por um, os arquivos com `suggested_target`
   preenchido no manifesto e pergunte se ele quer que você aplique aquela
   integração agora — só prossiga com o que for confirmado explicitamente.

8. **Grave a versão instalada**: escreva/atualize `iabrain/INSTALLED_VERSION`
   com o número da versão baixada (só o número, ex.: `0.01`), depois de
   completar os passos acima com sucesso.

9. **Resuma o que foi feito** — versão instalada, arquivos baixados, o que
   foi integrado (se algo foi) e o que ficou pendente de confirmação —
   sem assumir que o usuário vai ler o histórico de comandos.

**Se qualquer busca de URL falhar** (rede, arquivo não encontrado, JSON
inválido): pare e reporte o erro, não invente conteúdo de substituição.

**Nunca rode `git commit`/`git push` como parte deste processo** — deixe
o usuário revisar o diff (`git status`/`git diff`) e decidir se e quando
commitar.
