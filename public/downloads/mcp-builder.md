# MCP Builder — Guia Geral

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias
> de qualquer tipo. Leia, entenda e adapte antes de usar em produção —
> especialmente a parte de autenticação, que lida com credenciais de
> verdade. O autor não se responsabiliza por qualquer dano, vazamento de
> credencial ou mau funcionamento decorrente do uso deste conteúdo.
>
> **Guia vivo**: diferente de uma lição de incidente único, este documento
> é atualizado com o tempo conforme aparecem novos provedores/casos de
> autenticação — trate a versão baixada como um retrato de um momento, não
> como definitiva.

Guia de referência para criar servidores MCP (Model Context Protocol) que
conectam um LLM a serviços externos, incluindo o fluxo completo de
autenticação com fallback automático de túnel (Cloudflare) quando o
provedor não aceita `localhost` como redirect URI.

---

## 1. Visão geral da arquitetura

```
Cliente MCP (Claude, etc)
        │
        │ stdio ou HTTP/SSE
        ▼
Servidor MCP
        │
        ├── camada de tools (o que o modelo pode chamar)
        ├── camada de auth (credenciais, tokens, refresh)
        └── camada de API client (chamadas HTTP pro serviço real)
```

Regra de ouro: **o modelo nunca vê a credencial**. Ele só chama a tool pelo
nome; o token fica isolado na camada de execução do servidor.

---

## 2. Escolhendo o transporte

| Cenário | Transporte | Observação |
|---|---|---|
| Ferramenta local (arquivos, shell, banco local) | `stdio` | Sem rede, processo filho do cliente |
| Serviço de terceiro que aceita `localhost` no redirect URI | `stdio` + loopback OAuth | Ex: GitHub |
| Serviço enterprise/Meta/Google que exige HTTPS público | `stdio` + túnel, ou servidor remoto | Ex: Instagram/Meta |
| Precisa ficar disponível 24/7 (webhooks, cron) | HTTP/SSE remoto | Hospedado em nuvem |

---

## 3. Estrutura de projeto recomendada

```
meu-mcp-server/
├── src/
│   ├── index.ts          # entrypoint, registro das tools
│   ├── auth.ts           # lógica de credenciais (ver seção 4)
│   ├── tunnel.ts         # fallback de túnel Cloudflare (ver seção 5)
│   ├── client.ts         # API client autenticado
│   └── tools/
│       ├── get-profile.ts
│       └── list-posts.ts
├── .env                  # tokens e config local (nunca commitado)
├── .env.example
├── package.json
└── tsconfig.json
```

Stack recomendada: **TypeScript + MCP SDK oficial**, `stdio` para uso
local, Zod para schemas de input/output.

---

## 4. Fluxo de autenticação (com fallback automático)

Lógica central: checar `.env` → validar → se inválido, decidir entre
**loopback simples** ou **túnel Cloudflare**, dependendo do que o provedor
aceita.

```typescript
// src/auth.ts
import 'dotenv/config';
import http from 'node:http';
import open from 'open';
import { appendFileSync } from 'node:fs';
import { startCloudflareTunnel } from './tunnel.js';

const PROVIDER_ACCEPTS_LOCALHOST = false; // configurar por provedor

export async function ensureAuth(): Promise<string> {
  let token = process.env.SERVICE_ACCESS_TOKEN;

  if (token && (await isValid(token))) return token;

  return PROVIDER_ACCEPTS_LOCALHOST
    ? authViaLoopback()
    : authViaTunnel();
}

async function isValid(token: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.servico.com/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// --- Caminho A: provedor aceita localhost (ex: GitHub) ---
async function authViaLoopback(): Promise<string> {
  return new Promise((resolve, reject) => {
    const state = crypto.randomUUID();
    const server = http
      .createServer(async (req, res) => {
        const url = new URL(req.url ?? '', 'http://localhost:8787');
        if (url.pathname !== '/callback') return;

        if (url.searchParams.get('state') !== state) {
          res.writeHead(400).end('State inválido.');
          return;
        }

        const code = url.searchParams.get('code');
        const token = await exchangeCodeForToken(code!, 'http://localhost:8787/callback');
        persistToken(token);
        res.end('Autenticado! Pode fechar essa aba.');
        server.close();
        resolve(token);
      })
      .listen(8787);

    open(buildAuthUrl('http://localhost:8787/callback', state));

    setTimeout(() => {
      server.close();
      reject(new Error('Timeout: usuário não autorizou em 2 minutos.'));
    }, 120_000);
  });
}

// --- Caminho B: provedor exige HTTPS público (ex: Meta/Instagram) ---
async function authViaTunnel(): Promise<string> {
  const { publicUrl, closeTunnel } = await startCloudflareTunnel(8787);
  const redirectUri = `${publicUrl}/callback`;

  return new Promise((resolve, reject) => {
    const state = crypto.randomUUID();
    const server = http
      .createServer(async (req, res) => {
        const url = new URL(req.url ?? '', publicUrl);
        if (url.pathname !== '/callback') return;

        if (url.searchParams.get('state') !== state) {
          res.writeHead(400).end('State inválido.');
          return;
        }

        const code = url.searchParams.get('code');
        const token = await exchangeCodeForToken(code!, redirectUri);
        persistToken(token);
        res.end('Autenticado! Pode fechar essa aba.');
        server.close();
        closeTunnel();
        resolve(token);
      })
      .listen(8787);

    console.log(`Redirect URI temporário: ${redirectUri}`);
    console.log('Cadastre esse valor no app do provedor caso ainda não tenha um fixo.');
    open(buildAuthUrl(redirectUri, state));

    setTimeout(() => {
      server.close();
      closeTunnel();
      reject(new Error('Timeout: usuário não autorizou em 2 minutos.'));
    }, 120_000);
  });
}

function persistToken(token: string) {
  appendFileSync('.env', `\nSERVICE_ACCESS_TOKEN=${token}`);
}
```

Pontos que não podem faltar:
- **`state` aleatório** verificado no callback — evita que outra
  requisição sequestre a sessão.
- **Timeout** — sem isso, uma autorização abandonada trava o processo pra
  sempre.
- **Nunca logar o token completo** — só confirmar sucesso/falha.

---

## 5. Fallback de túnel via Cloudflare CLI (`cloudflared`)

Quando o provedor exige HTTPS público, o servidor MCP sobe automaticamente
um túnel rápido (`cloudflared tunnel --url`), que não exige conta
Cloudflare nem DNS configurado — gera uma URL pública temporária tipo
`https://random-words.trycloudflare.com`.

```typescript
// src/tunnel.ts
import { spawn } from 'node:child_process';

export async function startCloudflareTunnel(
  localPort: number
): Promise<{ publicUrl: string; closeTunnel: () => void }> {
  await ensureCloudflaredInstalled();

  return new Promise((resolve, reject) => {
    const proc = spawn('cloudflared', [
      'tunnel',
      '--url', `http://localhost:${localPort}`,
      '--no-autoupdate',
    ]);

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error('Timeout esperando o cloudflared gerar a URL do túnel.'));
    }, 20_000);

    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match) {
        clearTimeout(timeout);
        resolve({
          publicUrl: match[0],
          closeTunnel: () => proc.kill(),
        });
      }
    });

    proc.on('exit', (code) => {
      if (code !== 0) reject(new Error(`cloudflared saiu com código ${code}`));
    });
  });
}

async function ensureCloudflaredInstalled(): Promise<void> {
  return new Promise((resolve, reject) => {
    const check = spawn('cloudflared', ['--version']);
    check.on('error', () =>
      reject(
        new Error(
          'cloudflared não encontrado. Instale com:\n' +
            '  macOS:   brew install cloudflared\n' +
            '  Linux:   veja https://pkg.cloudflare.com\n' +
            '  Windows: winget install --id Cloudflare.cloudflared'
        )
      )
    );
    check.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('cloudflared instalado mas falhou ao rodar --version'))));
  });
}
```

### Por que `cloudflared tunnel --url` e não um túnel nomeado

- **Zero configuração**: não precisa de conta Cloudflare, domínio, nem
  `cloudflared tunnel login`. Sobe e já devolve uma URL HTTPS válida.
- **Efêmero por natureza**: a URL muda a cada execução — perfeito pra um
  fluxo de auth que só precisa existir por 2 minutos, ruim se você
  precisar de um redirect URI fixo cadastrado permanentemente no app do
  provedor.
- **Se o provedor exigir redirect URI fixo** (não aceita trocar a cada
  login), a alternativa é um túnel nomeado (`cloudflared tunnel create
  meu-mcp` + `cloudflared tunnel route dns`), que dá uma URL estável tipo
  `https://auth.seudominio.com`, mas exige domínio próprio configurado na
  Cloudflare.

---

## 6. Checklist de segurança

- [ ] Token nunca aparece em logs, prompts ou respostas de tool pro modelo
- [ ] `.env` está no `.gitignore`
- [ ] `state` do OAuth é verificado no callback
- [ ] Timeout em toda espera de callback
- [ ] Tools que **escrevem** (postar, deletar, enviar) pedem confirmação
      explícita antes de executar
- [ ] Refresh token tratado automaticamente quando o access token expira
- [ ] Túnel é fechado (`closeTunnel()`) assim que o auth termina — não
      fica rodando em background sem necessidade

---

## 7. Checklist de qualidade da tool (independente do auth)

- [ ] Nome com prefixo consistente (`instagram_get_profile`,
      `instagram_list_posts`)
- [ ] Descrição curta e orientada à ação
- [ ] Schema de input com Zod, com exemplos na descrição de cada campo
- [ ] Mensagens de erro acionáveis ("token expirado, rode `ensureAuth()`
      novamente" em vez de "401")
- [ ] Anotações: `readOnlyHint`, `destructiveHint`, `idempotentHint`,
      `openWorldHint`
- [ ] Paginação suportada quando a API devolve listas grandes

---

## 8. Referências

- Especificação MCP: `https://modelcontextprotocol.io/specification/draft.md`
- SDK TypeScript: `https://github.com/modelcontextprotocol/typescript-sdk`
- SDK Python: `https://github.com/modelcontextprotocol/python-sdk`
- Cloudflare Tunnel (quick tunnels):
  `https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/trycloudflare/`
