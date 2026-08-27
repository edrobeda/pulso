# Checklist: uma rota nova não propaga sozinha

> ⚠️ **Aviso legal**: este material é fornecido "como está", sem garantias de
> qualquer tipo, extraído e adaptado de casos reais para uso genérico. Leia,
> entenda e adapte antes de usar. O autor não se responsabiliza por qualquer
> dano ou mau funcionamento decorrente do uso deste conteúdo.

## O problema

O roteador da aplicação (React Router, Vue Router, o que for) é a lista
canônica de páginas — mas quase todo projeto tem outras listas que
deveriam derivar dela e, na prática, são mantidas à mão, em paralelo:

- `sitemap.xml`
- dados estruturados (JSON-LD) por tipo de página
- menu de navegação / breadcrumbs
- controle de acesso por rota
- `robots.txt` (allow/disallow específico)
- lista de rotas pré-renderizadas (SSG) ou cacheadas (CDN/edge)

Uma página nova pode ser adicionada ao roteador, funcionar perfeitamente
(link direto abre, sem erro no console, build passa) e ainda assim ficar
ausente de uma ou mais dessas listas por tempo indefinido — porque nada
quebra tecnicamente, só fica incompleto. Não existe erro pra notar, só uma
ausência silenciosa que só aparece se alguém comparar as duas listas à mão.

```js
// exemplo do padrão problemático: duas fontes de verdade que deveriam
// ser uma só, mantidas por pessoas/rodadas diferentes em momentos
// diferentes

// router.js — fonte real das rotas
const routes = ['/', '/posts/:slug', '/tags', '/sobre', '/nova-pagina']

// sitemap.js — cópia manual, escrita antes de '/nova-pagina' existir
const staticRoutesForSitemap = ['/', '/tags', '/sobre'] // esqueceu de atualizar
```

## A lição

Duas soluções, em ordem de preferência:

1. **Elimine a segunda lista.** Gere sitemap/menu/JSON-LD a partir do mesmo
   array de rotas que o roteador usa, em vez de duplicar manualmente. Nem
   sempre dá (às vezes uma lista precisa de metadado que o roteador não
   tem, tipo prioridade de SEO), mas quando dá, é a correção definitiva —
   não tem como esquecer de atualizar algo que não existe mais como cópia.

2. **Se não dá pra eliminar, teste a consistência.** Um teste automatizado
   simples que compara as duas listas e falha quando divergem custa poucas
   linhas e transforma um esquecimento silencioso em uma falha de CI
   barulhenta, no momento em que a rota é adicionada — não semanas depois.

```js
// exemplo genérico de teste de consistência (adapte ao seu test runner)
import { routes } from './router.js'
import { staticRoutesForSitemap } from './sitemap.js'

test('toda rota estática do roteador está no sitemap', () => {
  const dynamicOrExcluded = ['/posts/:slug', '/tags/:tag'] // padrões conhecidos, não comparáveis 1:1
  const staticRoutes = routes.filter((r) => !dynamicOrExcluded.includes(r))

  for (const route of staticRoutes) {
    expect(staticRoutesForSitemap).toContain(route)
  }
})
```

## Checklist ao adicionar uma rota nova

- [ ] Ela precisa aparecer no `sitemap.xml` (ou equivalente)?
- [ ] Ela precisa de dados estruturados (JSON-LD) próprios, ou herda de
      algum template genérico?
- [ ] Ela precisa aparecer em algum menu/nav/breadcrumb mantido à parte do
      roteador?
- [ ] Ela tem alguma regra de acesso (pública/autenticada/admin) que
      precisa ser registrada em alguma lista de permissões separada?
- [ ] Se a resposta a qualquer item acima for "sim, e é mantido à mão": dá
      pra eliminar a duplicação lendo a lista de rotas real? Se não dá,
      existe (ou vale criar) um teste que falha se as duas listas
      divergirem?
