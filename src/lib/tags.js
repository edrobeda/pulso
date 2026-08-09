import { sortPosts } from '../content/posts'

export function slugifyTag(tag) {
  return tag
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function postsByTagSlug(posts, tagSlug) {
  return sortPosts(posts).filter((post) => post.tags.some((tag) => slugifyTag(tag) === tagSlug))
}

export function tagLabelFromSlug(posts, tagSlug) {
  for (const post of sortPosts(posts)) {
    const match = post.tags.find((tag) => slugifyTag(tag) === tagSlug)
    if (match) return match
  }
  return tagSlug
}

export function allTagSlugs(posts) {
  const slugs = new Set()
  for (const post of posts) {
    for (const tag of post.tags) slugs.add(slugifyTag(tag))
  }
  return [...slugs]
}

export function tagCounts(posts) {
  const bySlug = new Map()
  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = slugifyTag(tag)
      const entry = bySlug.get(slug)
      if (entry) entry.count += 1
      else bySlug.set(slug, { slug, label: tag, count: 1 })
    }
  }
  return [...bySlug.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}
