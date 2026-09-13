import { describe, expect, it } from 'vitest'
import { slugifyTag, postsByTagSlug, tagLabelFromSlug, allTagSlugs, tagCounts } from './tags'

const posts = [
  { slug: 'a', date: '2026-09-01', slot: '08:00', tags: ['Agentes', 'Código'] },
  { slug: 'b', date: '2026-09-02', slot: '13:00', tags: ['Agentes'] },
  { slug: 'c', date: '2026-09-03', slot: '08:00', tags: ['SEO'] },
]

describe('slugifyTag', () => {
  it('remove acentos, espaços e caixa alta', () => {
    expect(slugifyTag('Código')).toBe('codigo')
    expect(slugifyTag('IA Generativa')).toBe('ia-generativa')
  })
})

describe('postsByTagSlug', () => {
  it('filtra só os posts que têm a tag pedida', () => {
    const result = postsByTagSlug(posts, 'agentes')
    expect(result.map((p) => p.slug).sort()).toEqual(['a', 'b'])
  })
})

describe('tagLabelFromSlug', () => {
  it('devolve o rótulo original (com acento/caixa) a partir do slug', () => {
    expect(tagLabelFromSlug(posts, 'codigo')).toBe('Código')
  })

  it('devolve o próprio slug se nenhum post tiver essa tag', () => {
    expect(tagLabelFromSlug(posts, 'inexistente')).toBe('inexistente')
  })
})

describe('allTagSlugs', () => {
  it('lista slugs únicos de todas as tags', () => {
    expect(allTagSlugs(posts).sort()).toEqual(['agentes', 'codigo', 'seo'])
  })
})

describe('tagCounts', () => {
  it('ordena por contagem decrescente', () => {
    const counts = tagCounts(posts)
    expect(counts[0]).toMatchObject({ slug: 'agentes', count: 2 })
  })
})
