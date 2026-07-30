import { sortedPosts } from '../content/posts'

export function slugifyTag(tag) {
  return tag
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function postsByTagSlug(tagSlug) {
  return sortedPosts().filter((post) => post.tags.some((tag) => slugifyTag(tag) === tagSlug))
}

export function tagLabelFromSlug(tagSlug) {
  for (const post of sortedPosts()) {
    const match = post.tags.find((tag) => slugifyTag(tag) === tagSlug)
    if (match) return match
  }
  return tagSlug
}

export function allTagSlugs() {
  const slugs = new Set()
  for (const post of sortedPosts()) {
    for (const tag of post.tags) slugs.add(slugifyTag(tag))
  }
  return [...slugs]
}
