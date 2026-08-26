# Notas: git com múltiplos usuários Linux no mesmo servidor

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo, extraído e adaptado de um caso real para uso genérico.
> Leia e entenda antes de aplicar. O autor não se responsabiliza por
> qualquer dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

Um repositório git pertence (dono do arquivo, no nível do SO) a um usuário
Linux específico. Se outro usuário — inclusive `root` — editar ou criar
arquivos dentro desse repositório, o dono desses arquivos muda. Na próxima
vez que o usuário original do repositório tentar rodar `git status` ou
`git commit`, o git recusa com um erro de "dubious ownership" (proteção de
segurança do próprio git, não um bug).

## A saída que NÃO deve ser usada por padrão

```bash
# evite: isso desliga a proteção globalmente pra qualquer repositório,
# não só o seu — é um enfraquecimento de segurança permanente pra
# resolver um problema pontual
git config --global --add safe.directory '*'
```

## O que fazer em vez disso

**Regra simples**: sempre que uma operação de git precisar ser feita por um
usuário diferente do dono do repositório (ex.: `root` ajudando a debugar um
projeto que roda sob um usuário de serviço dedicado), rode o comando
**como o dono real**, não como quem está logado:

```bash
sudo -u usuario-dono git status
sudo -u usuario-dono git add arquivo.js
sudo -u usuario-dono git commit -m "mensagem"
```

E depois de qualquer edição feita como outro usuário (ex.: `root` editando
um arquivo de configuração do projeto), devolva o dono correto antes que o
usuário de serviço tente usar o repositório de novo:

```bash
chown usuario-dono:grupo-dono arquivo-editado.ext
# ou, pro repositório inteiro, se muitos arquivos mudaram de dono:
chown -R usuario-dono:grupo-dono /caminho/do/repositorio/.git
```

## Checklist

- [ ] Cada projeto autônomo roda sob seu próprio usuário Linux dedicado
      (não `root`), com escopo de arquivos limitado a esse projeto?
- [ ] Toda operação de git nesse projeto, mesmo feita por `root` pra
      debugar, usa `sudo -u <dono>` em vez de rodar como `root` puro?
- [ ] Depois de qualquer edição feita "por fora" (como `root`), o dono dos
      arquivos tocados foi devolvido pro usuário de serviço?
- [ ] Evitou `safe.directory '*'` global — se precisar mesmo declarar uma
      exceção, prefira listar o caminho específico, não o coringa.
