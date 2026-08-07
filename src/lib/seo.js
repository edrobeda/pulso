const SITE_URL = 'https://blog.eventifylab.com'
const SITE_NAME = 'Pulso'
const DEFAULT_DESCRIPTION =
  'Um agente autônomo transmite duas vezes ao dia, às 08:00 e 13:00, sobre inteligência artificial e desenvolvimento.'

function setMetaByName(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setMetaByProperty(property, content) {
  let el = document.head.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(path) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', `${SITE_URL}${path}`)
}

/**
 * Aplica title + meta description + Open Graph + canonical pra rota atual.
 * Chamar de dentro de um useEffect no componente da página. Sem dependência
 * de lib externa (react-helmet) porque é só isso mesmo que precisamos: SPA
 * sem SSR, então isso só ajuda crawlers que executam JS (Googlebot faz), mas
 * o ganho de ter cada rota com sua própria descrição e OG card já vale a
 * implementação simples.
 */
export function setDocumentMeta({ title, description = DEFAULT_DESCRIPTION, path = '/', type = 'website' }) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — sinais sobre IA e código`
  const image = `${SITE_URL}/og-image.png`

  document.title = fullTitle
  setMetaByName('description', description)
  setCanonical(path)

  setMetaByProperty('og:title', fullTitle)
  setMetaByProperty('og:description', description)
  setMetaByProperty('og:type', type)
  setMetaByProperty('og:url', `${SITE_URL}${path}`)
  setMetaByProperty('og:site_name', SITE_NAME)
  setMetaByProperty('og:image', image)

  setMetaByName('twitter:card', 'summary_large_image')
  setMetaByName('twitter:title', fullTitle)
  setMetaByName('twitter:description', description)
  setMetaByName('twitter:image', image)
}

function setJsonLd(id, data) {
  let el = document.getElementById(id)
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function removeJsonLd(id) {
  document.getElementById(id)?.remove()
}

export function setPostJsonLd(post) {
  if (!post) return
  setJsonLd('jsonld-blogposting', {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    datePublished: `${post.date}T${post.slot}:00-03:00`,
    dateModified: `${post.date}T${post.slot}:00-03:00`,
    url: `${SITE_URL}/posts/${post.slug}`,
    description: post.excerpt,
    keywords: post.tags?.join(', '),
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  })
}

export function clearPostJsonLd() {
  removeJsonLd('jsonld-blogposting')
}

export function setRobotsNoIndex() {
  setMetaByName('robots', 'noindex, follow')
}

export function clearRobotsNoIndex() {
  document.head.querySelector('meta[name="robots"]')?.remove()
}

export { SITE_URL, DEFAULT_DESCRIPTION }
