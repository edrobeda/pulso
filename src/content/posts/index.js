// Posts vêm do Postgres via API (`/api/posts`), não mais de arquivo estático
// — migrado em 2026-08-01. O agente de publicação insere posts novos direto
// no banco (ver .agent-prompt.md), então este módulo só busca e cacheia.
import { useEffect, useState } from 'react'

let listCache = null // confirmado via rede nesta sessão do app
let listPromise = null

// O service worker (public/sw.js) usa network-first pra /api/*, então toda
// abertura fria do app (nova aba, PWA reaberta) espera o round-trip inteiro
// antes de mostrar o feed — mesmo se o conteúdo mudou pouco desde a última
// vez. Guarda a última lista boa em localStorage e mostra ela na hora (sem
// "carregando…") enquanto revalida em segundo plano, estilo
// stale-while-revalidate. TTL generoso (7 dias) só pra não exibir algo
// absurdamente velho se o usuário voltar depois de muito tempo offline.
const STORAGE_KEY = 'pulso:posts-cache:v1'
const STORAGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
let storageSeed // undefined = ainda não checou; null = nada aproveitável

function readStoredList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.savedAt !== 'number') return null
    if (Date.now() - parsed.savedAt > STORAGE_MAX_AGE_MS) return null
    return parsed.data
  } catch {
    return null // localStorage indisponível (modo privado) ou dado corrompido
  }
}

function writeStoredList(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), data }))
  } catch {
    // quota cheia ou storage indisponível — cache em memória já cobre a sessão atual
  }
}

function getStorageSeed() {
  if (storageSeed === undefined) storageSeed = readStoredList()
  return storageSeed
}

function loadList() {
  if (listCache) return Promise.resolve(listCache)
  if (!listPromise) {
    listPromise = fetch('/api/posts')
      .then((r) => {
        if (!r.ok) throw new Error(`GET /api/posts -> ${r.status}`)
        return r.json()
      })
      .then((data) => {
        listCache = data
        writeStoredList(data)
        return data
      })
      .catch((err) => {
        listPromise = null // permite tentar de novo numa próxima chamada
        throw err
      })
  }
  return listPromise
}

/**
 * Metadado de todos os posts (sem `blocks` — ver comentário em
 * `/api/posts` no server). Busca uma vez só e cacheia em memória pro resto
 * da sessão do browser (mais um seed em localStorage pra abertura fria não
 * começar em branco). Pra o corpo de um post específico, use
 * `usePostBody(slug)`.
 */
export function usePosts() {
  const [state, setState] = useState(() => {
    if (listCache) return { posts: listCache, loading: false, error: null }
    const seed = getStorageSeed()
    return seed
      ? { posts: seed, loading: false, error: null }
      : { posts: [], loading: true, error: null }
  })

  useEffect(() => {
    if (listCache) return // já confirmado via rede nesta sessão, nada a revalidar
    let cancelled = false
    loadList()
      .then((posts) => {
        if (!cancelled) setState({ posts, loading: false, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        // Sem rede: prefere manter o seed velho na tela a esvaziar o feed.
        const seed = getStorageSeed()
        setState(seed ? { posts: seed, loading: false, error: null } : { posts: [], loading: false, error })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

const bodyCache = new Map()

/**
 * Corpo completo (com `blocks`) de um post, sob demanda — cacheado por
 * `slug` pra não refazer o fetch ao voltar pro mesmo post na sessão.
 */
export function usePostBody(slug) {
  const [state, setState] = useState(() =>
    bodyCache.has(slug)
      ? { post: bodyCache.get(slug), loading: false, error: null }
      : { post: null, loading: true, error: null }
  )

  useEffect(() => {
    if (!slug) return
    if (bodyCache.has(slug)) {
      setState({ post: bodyCache.get(slug), loading: false, error: null })
      return
    }
    let cancelled = false
    setState({ post: null, loading: true, error: null })
    fetch(`/api/posts/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error(`GET /api/posts/${slug} -> ${r.status}`)
        return r.json()
      })
      .then((post) => {
        bodyCache.set(slug, post)
        if (!cancelled) setState({ post, loading: false, error: null })
      })
      .catch((error) => {
        if (!cancelled) setState({ post: null, loading: false, error })
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  return state
}

function slotMinutes(slot) {
  const [h, m] = slot.split(':').map(Number)
  return h * 60 + m
}

/** A API já ordena por data/slot decrescente; reordena por garantia. */
export function sortPosts(posts) {
  return [...posts].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return slotMinutes(b.slot) - slotMinutes(a.slot)
  })
}

export function findPost(posts, slug) {
  return posts.find((p) => p.slug === slug) || null
}

export function groupByDay(posts) {
  const groups = new Map()
  for (const post of sortPosts(posts)) {
    if (!groups.has(post.date)) groups.set(post.date, {})
    groups.get(post.date)[post.slot] = post
  }
  return [...groups.entries()].map(([date, slots]) => ({ date, slots }))
}
