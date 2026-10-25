import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { usePosts, usePostBody, findPost, sortPosts } from '../content/posts'
import { postDateTimeLabel, commentDateLabel } from '../lib/format'
import PulseSignature from '../components/PulseSignature'
import {
  setDocumentMeta,
  setPostJsonLd,
  clearPostJsonLd,
  setBreadcrumbJsonLd,
  clearBreadcrumbJsonLd,
  SITE_URL,
} from '../lib/seo'
import { slugifyTag } from '../lib/tags'
import { isSaved, toggleSaved } from '../lib/saved'
import { precachePostOffline, dropPostOfflineCache } from '../lib/offlineCache'
import { getClientToken } from '../lib/clientToken'
import { useEscapeToClose } from '../hooks/useEscapeToClose'

function viewsLabel(count) {
  return count === 1 ? '1 leitura' : `${count} leituras`
}

const REACTION_EMOJIS = ['👍', '💡', '🔥', '❤️']
const REACTION_LABELS = {
  '👍': 'concordo',
  '💡': 'aprendi algo',
  '🔥': 'ótimo pulso',
  '❤️': 'adorei',
}

function reactedStorageKey(slug) {
  return `pulso-reacted-${slug}`
}

function loadReacted(slug) {
  try {
    return JSON.parse(localStorage.getItem(reactedStorageKey(slug)) || '[]')
  } catch {
    return []
  }
}

const NIGHT_READING_KEY = 'pulso-night-reading'

function loadNightReading() {
  try {
    const stored = localStorage.getItem(NIGHT_READING_KEY)
    if (stored !== null) return stored === '1'
  } catch {
    // ignora, cai no fallback de preferência de sistema abaixo
  }
  return typeof window !== 'undefined' && (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)
}

// Resume de leitura: quem lê no celular com uma mão só (bebê no colo, por
// exemplo) é interrompido com frequência e perde o lugar. Guarda o % de
// scroll por post (não a posição em px, que muda se o texto reflui) e
// oferece voltar pra lá na próxima visita — só dentro de uma faixa que
// sinaliza "estava no meio", não em quem mal abriu ou já terminou.
const RESUME_KEY_PREFIX = 'pulso-resume-'
const RESUME_MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000 // 60 dias
const RESUME_MIN_PCT = 8
const RESUME_MAX_PCT = 92

function resumeKey(slug) {
  return `${RESUME_KEY_PREFIX}${slug}`
}

function loadResumePct(slug) {
  try {
    const raw = localStorage.getItem(resumeKey(slug))
    if (!raw) return null
    const { pct, savedAt } = JSON.parse(raw)
    if (typeof pct !== 'number' || typeof savedAt !== 'number') return null
    if (Date.now() - savedAt > RESUME_MAX_AGE_MS) return null
    if (pct < RESUME_MIN_PCT || pct > RESUME_MAX_PCT) return null
    return pct
  } catch {
    return null
  }
}

function saveResumePct(slug, pct) {
  try {
    if (pct < RESUME_MIN_PCT || pct > RESUME_MAX_PCT) {
      localStorage.removeItem(resumeKey(slug))
      return
    }
    localStorage.setItem(resumeKey(slug), JSON.stringify({ pct, savedAt: Date.now() }))
  } catch {
    // modo privado/quota cheia: só não persiste entre sessões, sem quebrar nada
  }
}

const FLAGGED_KEY = 'pulso-flagged-comments'

function loadFlagged() {
  try {
    return JSON.parse(localStorage.getItem(FLAGGED_KEY) || '[]')
  } catch {
    return []
  }
}

const LIKED_KEY = 'pulso-liked-comments'

function loadLiked() {
  try {
    return JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')
  } catch {
    return []
  }
}

const WATCHED_KEY = 'pulso-watched-comments'

function loadWatched() {
  try {
    return JSON.parse(localStorage.getItem(WATCHED_KEY) || '[]')
  } catch {
    return []
  }
}

// Comentários publicados a partir deste navegador, pra mostrar o botão
// "excluir" só pro autor — mesma ideia do token em comment_likes/flags, só
// que guardado localmente (o servidor não devolve author_token em nenhuma
// resposta). `postedAt` decide quando o botão para de aparecer (ver
// COMMENT_DELETE_WINDOW_MS abaixo); corta pra 50 entradas mais recentes pra
// não crescer sem limite ao longo de muitas visitas.
const MY_COMMENTS_KEY = 'pulso-my-comments'
const COMMENT_DELETE_WINDOW_MS = 15 * 60 * 1000

function loadMyComments() {
  try {
    return JSON.parse(localStorage.getItem(MY_COMMENTS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveMyComments(list) {
  try {
    localStorage.setItem(MY_COMMENTS_KEY, JSON.stringify(list.slice(-50)))
  } catch {
    // modo privado/quota cheia: o comentário publica normalmente, só não
    // vai ter botão de excluir nesta sessão
  }
}

const PUSH_SUPPORTED =
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

// Mesma conversão de chave VAPID do PushSubscribeWidget — duplicada aqui de
// propósito (função de 5 linhas, sem estado) em vez de criar um módulo
// compartilhado só pra isso.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

async function ensurePushSubscription() {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('permissão negada')
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing
  const keyRes = await fetch('/api/push/vapid-public-key')
  if (!keyRes.ok) throw new Error('push indisponível')
  const { publicKey } = await keyRes.json()
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  })
}

function saveLiked(ids) {
  localStorage.setItem(LIKED_KEY, JSON.stringify(ids))
}

function saveFlagged(ids) {
  localStorage.setItem(FLAGGED_KEY, JSON.stringify(ids))
}

function saveWatched(ids) {
  localStorage.setItem(WATCHED_KEY, JSON.stringify(ids))
}

// Pra ouvir em voz alta: título + parágrafos/quotes/headings, pulando bloco
// de código (ler código em voz alta não ajuda ninguém). Um SpeechSynthesisUtterance
// por bloco em vez de um texto gigante só — mais robusto contra o limite de
// alguns navegadores com utterances muito longas, e enfileira sozinho (a Web
// Speech API toca em ordem quem for passado pra speak() em sequência).
function buildSpeechSegments(post, postBody) {
  const segments = [post.title]
  if (postBody) {
    postBody.blocks.forEach((block) => {
      if (block.type !== 'code' && block.text) segments.push(block.text)
    })
  }
  return segments
}

function relatedPosts(allPosts, post) {
  if (!post) return []
  return allPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ post: p, shared: p.tags.filter((t) => post.tags.includes(t)).length }))
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.shared - a.shared || (a.post.date < b.post.date ? 1 : -1))
    .slice(0, 3)
    .map((entry) => entry.post)
}

// Ids de seção pro sumário (Table of Contents) — mesmo slugify de tags,
// serve bem pra texto livre também. Sufixo de índice evita colisão entre
// dois h2 com o mesmo texto no mesmo post.
function headingId(text, index) {
  return `s-${slugifyTag(text)}-${index}`
}

function CodeBlock({ text }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {})
  }

  return (
    <div className="code-block">
      <button type="button" className="code-block__copy" onClick={handleCopy}>
        {copied ? '✓ copiado' : 'copiar'}
      </button>
      <pre>
        <code>{text}</code>
      </pre>
    </div>
  )
}

// Âncora clicável ao lado de cada h2: some por padrão, aparece no hover/foco
// da seção e copia o link profundo pra ela (além do salto nativo via href).
function HeadingAnchor({ id }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  return (
    <a
      href={`#${id}`}
      className="prose__anchor"
      aria-label="Copiar link pra esta seção"
      onClick={handleCopy}
    >
      {copied ? '✓' : '#'}
    </a>
  )
}

function Block({ block, headingIndex }) {
  switch (block.type) {
    case 'h2': {
      const id = headingId(block.text, headingIndex)
      return (
        <h2 id={id}>
          <HeadingAnchor id={id} />
          {block.text}
        </h2>
      )
    }
    case 'quote':
      return <blockquote>{block.text}</blockquote>
    case 'code':
      return <CodeBlock text={block.text} />
    default:
      return <p>{block.text}</p>
  }
}

export default function PostPage() {
  const { slug } = useParams()
  const { posts, loading } = usePosts()
  const post = findPost(posts, slug)
  const { post: postBody } = usePostBody(post ? slug : null)
  const ordered = sortPosts(posts)
  const index = post ? ordered.findIndex((p) => p.slug === post.slug) : -1
  const newerPost = index > 0 ? ordered[index - 1] : null
  const olderPost = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null

  const [viewCount, setViewCount] = useState(post ? post.viewCount : 0)
  const countedSlug = useRef(null)

  const [reactions, setReactions] = useState({})
  const [reacted, setReacted] = useState([])
  const [saved, setSaved] = useState(false)

  const [comments, setComments] = useState([])
  const [commentName, setCommentName] = useState('')
  const [commentBody, setCommentBody] = useState('')
  const [commentHoneypot, setCommentHoneypot] = useState('')
  const [commentStatus, setCommentStatus] = useState('idle')
  const [commentError, setCommentError] = useState('')
  const [commentSuccess, setCommentSuccess] = useState('')
  const [flaggedIds, setFlaggedIds] = useState(loadFlagged)
  const [likedIds, setLikedIds] = useState(loadLiked)
  const [watchedIds, setWatchedIds] = useState(loadWatched)
  const [myComments, setMyComments] = useState(loadMyComments)
  const [deleteError, setDeleteError] = useState('')
  const [watchError, setWatchError] = useState('')

  // Só um comentário por vez tem o form de resposta aberto — reaproveita o
  // mesmo conjunto de campos em vez de um estado por comentário.
  const [replyTarget, setReplyTarget] = useState(null)
  // Guarda o botão "responder" que abriu o form atual, pra devolver o foco
  // nele quando Esc fechar (useEscapeToClose) — não dá pra usar um único
  // useRef fixo porque há um botão por comentário.
  const replyToggleRef = useRef(null)
  const [replyName, setReplyName] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [replyHoneypot, setReplyHoneypot] = useState('')
  const [replyStatus, setReplyStatus] = useState('idle')
  const [replyError, setReplyError] = useState('')
  // Form de resposta fecha ao publicar (replyTarget volta a null), então a
  // confirmação não pode morar dentro do form — fica ligada ao comentário-pai
  // em vez do estado do form, pra sobreviver ao fechamento.
  const [replySuccessFor, setReplySuccessFor] = useState(null)

  const [nightReading, setNightReading] = useState(loadNightReading)
  const [autoScroll, setAutoScroll] = useState(false)
  const [reducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  const [readProgress, setReadProgress] = useState(0)
  const [resumeOffer, setResumeOffer] = useState(null)
  const lastSavedPct = useRef(-1)
  const [copyState, setCopyState] = useState('idle')
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [ttsState, setTtsState] = useState('idle') // idle | playing | paused

  useEffect(() => {
    try {
      localStorage.setItem(NIGHT_READING_KEY, nightReading ? '1' : '0')
    } catch {
      // modo privado/quota cheia: a preferência só não sobrevive à sessão
    }
  }, [nightReading])

  useEffect(() => {
    if (!post) return
    function computePct() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      return scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0
    }
    // Só grava em localStorage a partir de scroll/resize real do usuário, nunca
    // na medição inicial do mount (que é sempre ~0% logo após navegar pro
    // post) — senão a oferta de "continuar de onde parei" seria apagada antes
    // da pessoa ter a chance de vê-la.
    function handleScroll() {
      const pct = computePct()
      setReadProgress(pct)
      const rounded = Math.round(pct)
      if (rounded !== lastSavedPct.current) {
        lastSavedPct.current = rounded
        saveResumePct(post.slug, rounded)
      }
    }
    setReadProgress(computePct())
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [post])

  useEffect(() => {
    if (!post) return
    setResumeOffer(loadResumePct(post.slug))
    lastSavedPct.current = -1
  }, [post?.slug])

  useEffect(() => {
    if (!post) return
    setDocumentMeta({
      title: post.title,
      description: post.excerpt,
      path: `/posts/${post.slug}`,
      type: 'article',
      publishedTime: `${post.date}T${post.slot}:00-03:00`,
      ogImagePath: `/api/og/${post.slug}.png`,
    })
    const wordCount = postBody
      ? postBody.blocks.reduce((sum, b) => sum + (b.text ? b.text.trim().split(/\s+/).filter(Boolean).length : 0), 0)
      : undefined
    setPostJsonLd(post, wordCount)
    setBreadcrumbJsonLd(post)
    return () => {
      clearPostJsonLd()
      clearBreadcrumbJsonLd()
    }
  }, [post, postBody])

  useEffect(() => {
    if (!post) return
    setViewCount(post.viewCount)
    if (countedSlug.current === post.slug) return
    countedSlug.current = post.slug
    fetch(`/api/posts/${post.slug}/view`, { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setViewCount(data.viewCount)
      })
      .catch(() => {})
  }, [post])

  useEffect(() => {
    if (!post) return
    setSaved(isSaved(post.slug))
  }, [post])

  useEffect(() => {
    if (!post) return
    setReacted(loadReacted(post.slug))
    fetch(`/api/posts/${post.slug}/reactions`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setReactions(data)
      })
      .catch(() => {})
  }, [post])

  useEffect(() => {
    if (!post) return
    fetch(`/api/posts/${post.slug}/comments`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setComments(data)
      })
      .catch(() => {})
  }, [post])

  // Desliga sozinho quando a pessoa troca de post (índice reseta o scroll pro topo).
  useEffect(() => {
    setAutoScroll(false)
  }, [post?.slug])

  // Cancela qualquer fala em andamento ao trocar de post ou sair da página —
  // senão o áudio do post anterior continua tocando por cima do novo.
  useEffect(() => {
    setTtsState('idle')
    return () => {
      if (ttsSupported) window.speechSynthesis.cancel()
    }
  }, [post?.slug, ttsSupported])

  useEscapeToClose(!!replyTarget, () => setReplyTarget(null), replyToggleRef)

  useEffect(() => {
    if (!autoScroll) return

    const PX_PER_FRAME = 0.4 // ritmo de leitura confortável, não uma rolagem rápida
    let raf

    function tick() {
      window.scrollBy(0, PX_PER_FRAME)
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom) {
        setAutoScroll(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // Qualquer gesto manual (roda do mouse, toque, arrastar barra, seta/espaço do teclado) pausa.
    function pauseOnManualInput() {
      setAutoScroll(false)
    }
    window.addEventListener('wheel', pauseOnManualInput, { passive: true })
    window.addEventListener('touchstart', pauseOnManualInput, { passive: true })
    window.addEventListener('mousedown', pauseOnManualInput, { passive: true })
    window.addEventListener('keydown', pauseOnManualInput)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', pauseOnManualInput)
      window.removeEventListener('touchstart', pauseOnManualInput)
      window.removeEventListener('mousedown', pauseOnManualInput)
      window.removeEventListener('keydown', pauseOnManualInput)
    }
  }, [autoScroll])

  function handleCommentSubmit(e) {
    e.preventDefault()
    if (!post || commentStatus === 'sending') return
    setCommentStatus('sending')
    setCommentError('')
    setCommentSuccess('')
    fetch(`/api/posts/${post.slug}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorName: commentName,
        body: commentBody,
        website: commentHoneypot,
        clientToken: getClientToken(),
      }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null)
        if (!r.ok) throw new Error(data?.error || 'não foi possível publicar o comentário')
        return data
      })
      .then((data) => {
        setComments((prev) => [...prev, data])
        const next = [...myComments, { id: data.id, postedAt: Date.now() }]
        setMyComments(next)
        saveMyComments(next)
        setCommentBody('')
        setCommentName('')
        setCommentStatus('idle')
        setCommentSuccess('comentário publicado.')
      })
      .catch((err) => {
        setCommentError(err.message)
        setCommentStatus('idle')
      })
  }

  function openReply(commentId, triggerEl) {
    setReplyTarget((current) => (current === commentId ? null : commentId))
    replyToggleRef.current = triggerEl
    setReplyError('')
    setReplySuccessFor(null)
    setReplyBody('')
  }

  function handleReplySubmit(e, parentCommentId) {
    e.preventDefault()
    if (!post || replyStatus === 'sending') return
    setReplyStatus('sending')
    setReplyError('')
    fetch(`/api/posts/${post.slug}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorName: replyName,
        body: replyBody,
        website: replyHoneypot,
        parentCommentId,
        clientToken: getClientToken(),
      }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null)
        if (!r.ok) throw new Error(data?.error || 'não foi possível publicar a resposta')
        return data
      })
      .then((data) => {
        setComments((prev) => [...prev, data])
        const next = [...myComments, { id: data.id, postedAt: Date.now() }]
        setMyComments(next)
        saveMyComments(next)
        setReplyBody('')
        setReplyName('')
        setReplyStatus('idle')
        setReplyTarget(null)
        setReplySuccessFor(parentCommentId)
      })
      .catch((err) => {
        setReplyError(err.message)
        setReplyStatus('idle')
      })
  }

  function handleFlagComment(commentId) {
    if (flaggedIds.includes(commentId)) return
    const next = [...flaggedIds, commentId]
    setFlaggedIds(next)
    saveFlagged(next)
    fetch(`/api/comments/${commentId}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientToken: getClientToken() }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.hidden) {
          setComments((prev) => prev.filter((c) => c.id !== commentId))
        }
      })
      .catch(() => {})
  }

  function handleLikeComment(commentId) {
    if (likedIds.includes(commentId)) return
    const next = [...likedIds, commentId]
    setLikedIds(next)
    saveLiked(next)
    fetch(`/api/comments/${commentId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientToken: getClientToken() }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setComments((prev) =>
            prev.map((c) => (c.id === commentId ? { ...c, like_count: data.likeCount } : c))
          )
        }
      })
      .catch(() => {})
  }

  function isOwnComment(commentId) {
    const entry = myComments.find((m) => m.id === commentId)
    return entry && Date.now() - entry.postedAt < COMMENT_DELETE_WINDOW_MS
  }

  function handleDeleteComment(commentId) {
    if (!post) return
    setDeleteError('')
    fetch(`/api/posts/${post.slug}/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientToken: getClientToken() }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null)
        if (!r.ok) throw new Error(data?.error || 'não foi possível excluir o comentário')
        return data
      })
      .then(() => {
        setComments((prev) => prev.filter((c) => c.id !== commentId))
        const next = myComments.filter((m) => m.id !== commentId)
        setMyComments(next)
        saveMyComments(next)
      })
      .catch((err) => setDeleteError(err.message))
  }

  async function handleWatchComment(commentId) {
    if (!PUSH_SUPPORTED || watchedIds.includes(commentId)) return
    setWatchError('')
    try {
      const sub = await ensurePushSubscription()
      const res = await fetch(`/api/comments/${commentId}/watch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (!res.ok) throw new Error('não deu pra ativar o aviso')
      const next = [...watchedIds, commentId]
      setWatchedIds(next)
      saveWatched(next)
    } catch (err) {
      setWatchError(
        err.message === 'permissão negada'
          ? 'notificações bloqueadas no navegador'
          : 'não deu pra ativar o aviso — tenta de novo'
      )
    }
  }

  async function handleUnwatchComment(commentId) {
    if (!PUSH_SUPPORTED) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch(`/api/comments/${commentId}/unwatch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
      }
    } catch {
      // melhor esforço: mesmo se a chamada falhar, tira do estado local
    }
    const next = watchedIds.filter((id) => id !== commentId)
    setWatchedIds(next)
    saveWatched(next)
  }

  function handleToggleSaved() {
    if (!post) return
    const next = toggleSaved(post.slug)
    const nowSaved = next.includes(post.slug)
    setSaved(nowSaved)
    if (nowSaved) precachePostOffline(post.slug)
    else dropPostOfflineCache(post.slug)
  }

  function handleCopyLink() {
    if (!post) return
    const url = `${SITE_URL}/posts/${post.slug}`
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopyState('copied')
        setTimeout(() => setCopyState('idle'), 2000)
      })
      .catch(() => {})
  }

  function handleNativeShare() {
    if (!post || !navigator.share) return
    navigator
      .share({ title: post.title, text: post.excerpt, url: `${SITE_URL}/posts/${post.slug}` })
      .catch(() => {})
  }

  function handleToggleSpeech() {
    if (!ttsSupported || !post) return
    if (ttsState === 'playing') {
      window.speechSynthesis.pause()
      setTtsState('paused')
      return
    }
    if (ttsState === 'paused') {
      window.speechSynthesis.resume()
      setTtsState('playing')
      return
    }
    window.speechSynthesis.cancel()
    const segments = buildSpeechSegments(post, postBody)
    segments.forEach((text, i) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'pt-BR'
      if (i === segments.length - 1) {
        utterance.onend = () => setTtsState('idle')
      }
      window.speechSynthesis.speak(utterance)
    })
    setTtsState('playing')
  }

  function handleStopSpeech() {
    if (!ttsSupported) return
    window.speechSynthesis.cancel()
    setTtsState('idle')
  }

  function handleResumeReading() {
    if (resumeOffer == null) return
    const scrollable = document.documentElement.scrollHeight - window.innerHeight
    if (scrollable > 0) {
      window.scrollTo({ top: (resumeOffer / 100) * scrollable, behavior: reducedMotion ? 'auto' : 'smooth' })
    }
    setResumeOffer(null)
  }

  function dismissResumeOffer() {
    setResumeOffer(null)
  }

  function handleReact(emoji) {
    if (!post || reacted.includes(emoji)) return
    const nextReacted = [...reacted, emoji]
    setReacted(nextReacted)
    localStorage.setItem(reactedStorageKey(post.slug), JSON.stringify(nextReacted))
    setReactions((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }))
    fetch(`/api/posts/${post.slug}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setReactions((prev) => ({ ...prev, [data.emoji]: data.count }))
      })
      .catch(() => {})
  }

  if (loading) return <p className="search-status">carregando…</p>
  if (!post) return <Navigate to="/404" replace />

  const related = relatedPosts(posts, post)
  const toc = postBody
    ? postBody.blocks
        .map((block, i) => (block.type === 'h2' ? { id: headingId(block.text, i), text: block.text } : null))
        .filter(Boolean)
    : []

  return (
    <div className="post-shell">
      <div className="read-progress" aria-hidden="true">
        <div className="read-progress__bar" style={{ width: `${readProgress}%` }} />
      </div>
      {reducedMotion ? null : autoScroll ? (
        <button
          type="button"
          className="autoscroll-btn autoscroll-btn--active"
          onClick={() => setAutoScroll(false)}
          aria-pressed="true"
        >
          ❚❚ <span>pausar leitura automática</span>
        </button>
      ) : (
        <button
          type="button"
          className="autoscroll-btn"
          onClick={() => setAutoScroll(true)}
          aria-pressed="false"
        >
          ▶ <span>leitura automática</span>
        </button>
      )}
      {ttsSupported && (
        <div className="tts-controls">
          <button
            type="button"
            className={`autoscroll-btn${ttsState !== 'idle' ? ' autoscroll-btn--active' : ''}`}
            onClick={handleToggleSpeech}
            aria-pressed={ttsState === 'playing'}
          >
            {ttsState === 'playing' ? '⏸' : '🔊'}{' '}
            <span>
              {ttsState === 'playing'
                ? 'pausar áudio'
                : ttsState === 'paused'
                  ? 'continuar áudio'
                  : 'ouvir este pulso'}
            </span>
          </button>
          {ttsState !== 'idle' && (
            <button
              type="button"
              className="tts-stop-btn"
              onClick={handleStopSpeech}
              aria-label="Parar leitura em voz alta"
            >
              ✕
            </button>
          )}
        </div>
      )}
      <div className="post-card" data-theme={nightReading ? 'night' : 'paper'}>
        <div className="post-card__band">
          <div className="post-card__meta">
            <PulseSignature slug={post.slug} size="lg" />
            <span>
              <time dateTime={`${post.date}T${post.slot}:00-03:00`}>{postDateTimeLabel(post)}</time> ·{' '}
              <strong>{post.readTime} min de leitura</strong> · {viewsLabel(viewCount)}
            </span>
          </div>
          <button
            type="button"
            className="night-toggle-btn"
            onClick={() => setNightReading((v) => !v)}
            aria-pressed={nightReading}
          >
            {nightReading ? '☀️' : '🌙'}{' '}
            <span>{nightReading ? 'papel claro' : 'modo noturno'}</span>
          </button>
        </div>
        <div className="post-card__body">
          <Link to="/" className="back-link">
            ← todos os pulsos
          </Link>
          <h1>{post.title}</h1>
          <ul className="tag-list post-card__tags">
            {post.tags.map((tag) => (
              <li className="tag-pill" key={tag}>
                <Link to={`/tags/${slugifyTag(tag)}`}>{tag}</Link>
              </li>
            ))}
          </ul>
          {resumeOffer != null && (
            <div className="resume-banner" role="status">
              <span>você parou por volta de {Math.round(resumeOffer)}% deste pulso.</span>
              <div className="resume-banner__actions">
                <button type="button" className="resume-banner__btn" onClick={handleResumeReading}>
                  continuar de onde parei
                </button>
                <button
                  type="button"
                  className="resume-banner__dismiss"
                  onClick={dismissResumeOffer}
                  aria-label="Dispensar aviso de continuar leitura"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          {toc.length >= 3 && (
            <nav className="toc" aria-label="Sumário do pulso">
              <p className="toc__label">nesse pulso</p>
              <ol className="toc__list">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}>{item.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="prose">
            {postBody ? (
              postBody.blocks.map((block, i) => <Block block={block} headingIndex={i} key={i} />)
            ) : (
              <p className="search-status">carregando pulso…</p>
            )}
          </div>
          <div className="reactions" role="group" aria-label="Reagir a este pulso">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`reaction-btn${reacted.includes(emoji) ? ' reaction-btn--active' : ''}`}
                onClick={() => handleReact(emoji)}
                disabled={reacted.includes(emoji)}
                aria-pressed={reacted.includes(emoji)}
                aria-label={`Reagir com ${REACTION_LABELS[emoji] || emoji} (${reactions[emoji] || 0} ${
                  (reactions[emoji] || 0) === 1 ? 'reação' : 'reações'
                })`}
              >
                <span className="reaction-btn__emoji" aria-hidden="true">
                  {emoji}
                </span>
                <span className="reaction-btn__count" aria-hidden="true">
                  {reactions[emoji] || 0}
                </span>
              </button>
            ))}
          </div>
          <div className="share" role="group" aria-label="Compartilhar este pulso">
            <p className="share__label">compartilhar</p>
            <div className="share__buttons">
              <button
                type="button"
                className={`share-btn${saved ? ' share-btn--active' : ''}`}
                onClick={handleToggleSaved}
                aria-pressed={saved}
              >
                {saved ? '✓ salvo' : '🔖 salvar pra depois'}
              </button>
              <button type="button" className="share-btn" onClick={handleCopyLink}>
                {copyState === 'copied' ? '✓ link copiado' : '🔗 copiar link'}
              </button>
              {typeof navigator !== 'undefined' && navigator.share && (
                <button type="button" className="share-btn" onClick={handleNativeShare}>
                  📤 compartilhar
                </button>
              )}
              <a
                className="share-btn"
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} — ${SITE_URL}/posts/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <a
                className="share-btn"
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`${SITE_URL}/posts/${post.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                X
              </a>
            </div>
          </div>
          {related.length > 0 && (
            <div className="related-posts">
              <p className="related-posts__label">pulsos relacionados</p>
              <ul className="related-posts__list">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link to={`/posts/${r.slug}`} className="related-posts__link">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="comments">
            <p className="comments__label">
              {comments.length === 0 ? 'comentários' : `comentários (${comments.length})`}
            </p>
            {watchError && (
              <p className="comment-form__error" role="alert">
                {watchError}
              </p>
            )}
            {deleteError && (
              <p className="comment-form__error" role="alert">
                {deleteError}
              </p>
            )}
            {comments.length > 0 && (
              <ul className="comments__list">
                {comments
                  .filter((c) => !c.parent_comment_id)
                  .map((c) => {
                    const replies = comments.filter((r) => r.parent_comment_id === c.id)
                    return (
                      <li className="comment" key={c.id} id={`comment-${c.id}`}>
                        <div className="comment__meta">
                          <strong>{c.author_name}</strong>
                          <time dateTime={c.created_at}>{commentDateLabel(c.created_at)}</time>
                          <div className="comment__actions">
                            <button
                              type="button"
                              className="comment__like"
                              onClick={() => handleLikeComment(c.id)}
                              disabled={likedIds.includes(c.id)}
                              aria-pressed={likedIds.includes(c.id)}
                              aria-label="Marcar este comentário como útil"
                            >
                              👍{c.like_count > 0 ? ` ${c.like_count}` : ''}
                            </button>
                            {PUSH_SUPPORTED && (
                              <button
                                type="button"
                                className="comment__watch"
                                onClick={() =>
                                  watchedIds.includes(c.id)
                                    ? handleUnwatchComment(c.id)
                                    : handleWatchComment(c.id)
                                }
                                aria-pressed={watchedIds.includes(c.id)}
                                aria-label="Avisar quando alguém responder este comentário"
                              >
                                {watchedIds.includes(c.id) ? '🔔 avisando' : '🔕 avisar resposta'}
                              </button>
                            )}
                            <button
                              type="button"
                              className="comment__flag"
                              onClick={() => handleFlagComment(c.id)}
                              disabled={flaggedIds.includes(c.id)}
                              aria-label="Sinalizar este comentário como spam ou problema"
                            >
                              {flaggedIds.includes(c.id) ? 'sinalizado' : 'sinalizar'}
                            </button>
                            {isOwnComment(c.id) && (
                              <button
                                type="button"
                                className="comment__delete"
                                onClick={() => handleDeleteComment(c.id)}
                                aria-label="Excluir seu comentário (disponível por 15 minutos)"
                              >
                                excluir
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="comment__body">{c.body}</p>
                        <button
                          type="button"
                          className="comment__reply-toggle"
                          onClick={(e) => openReply(c.id, e.currentTarget)}
                          aria-expanded={replyTarget === c.id}
                        >
                          {replyTarget === c.id ? 'cancelar' : 'responder'}
                        </button>
                        {replySuccessFor === c.id && (
                          <p className="comment-form__status" role="status" aria-live="polite">
                            resposta publicada.
                          </p>
                        )}

                        {replies.length > 0 && (
                          <ul className="comments__replies">
                            {replies.map((r) => (
                              <li className="comment comment--reply" key={r.id}>
                                <div className="comment__meta">
                                  <strong>{r.author_name}</strong>
                                  <time dateTime={r.created_at}>{commentDateLabel(r.created_at)}</time>
                                  <div className="comment__actions">
                                    <button
                                      type="button"
                                      className="comment__like"
                                      onClick={() => handleLikeComment(r.id)}
                                      disabled={likedIds.includes(r.id)}
                                      aria-pressed={likedIds.includes(r.id)}
                                      aria-label="Marcar esta resposta como útil"
                                    >
                                      👍{r.like_count > 0 ? ` ${r.like_count}` : ''}
                                    </button>
                                    <button
                                      type="button"
                                      className="comment__flag"
                                      onClick={() => handleFlagComment(r.id)}
                                      disabled={flaggedIds.includes(r.id)}
                                      aria-label="Sinalizar esta resposta como spam ou problema"
                                    >
                                      {flaggedIds.includes(r.id) ? 'sinalizado' : 'sinalizar'}
                                    </button>
                                    {isOwnComment(r.id) && (
                                      <button
                                        type="button"
                                        className="comment__delete"
                                        onClick={() => handleDeleteComment(r.id)}
                                        aria-label="Excluir sua resposta (disponível por 15 minutos)"
                                      >
                                        excluir
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="comment__body">{r.body}</p>
                              </li>
                            ))}
                          </ul>
                        )}

                        {replyTarget === c.id && (
                          <form
                            className="comment-form comment-form--reply"
                            onSubmit={(e) => handleReplySubmit(e, c.id)}
                          >
                            <input
                              type="text"
                              className="comment-form__name"
                              placeholder="nome (opcional)"
                              value={replyName}
                              onChange={(e) => setReplyName(e.target.value)}
                              maxLength={60}
                              aria-label={`Seu nome (resposta a ${c.author_name})`}
                            />
                            <input
                              type="text"
                              name="website"
                              className="comment-form__honeypot"
                              tabIndex={-1}
                              autoComplete="off"
                              aria-hidden="true"
                              value={replyHoneypot}
                              onChange={(e) => setReplyHoneypot(e.target.value)}
                            />
                            <textarea
                              className="comment-form__body"
                              placeholder="escreva sua resposta"
                              value={replyBody}
                              onChange={(e) => setReplyBody(e.target.value)}
                              maxLength={1000}
                              rows={2}
                              required
                              aria-label={`Sua resposta a ${c.author_name}`}
                            />
                            <p className="comment-form__counter" aria-hidden="true">
                              {replyBody.length}/1000
                            </p>
                            {replyError && (
                              <p className="comment-form__error" role="alert">
                                {replyError}
                              </p>
                            )}
                            <button
                              type="submit"
                              className="comment-form__submit"
                              disabled={replyStatus === 'sending'}
                            >
                              {replyStatus === 'sending' ? 'enviando…' : 'responder'}
                            </button>
                          </form>
                        )}
                      </li>
                    )
                  })}
              </ul>
            )}
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <input
                type="text"
                className="comment-form__name"
                placeholder="nome (opcional)"
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                maxLength={60}
                aria-label="Seu nome"
              />
              <input
                type="text"
                name="website"
                className="comment-form__honeypot"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={commentHoneypot}
                onChange={(e) => setCommentHoneypot(e.target.value)}
              />
              <textarea
                className="comment-form__body"
                placeholder="deixe um comentário"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                maxLength={1000}
                rows={3}
                required
                aria-label="Seu comentário"
              />
              <p className="comment-form__counter" aria-hidden="true">
                {commentBody.length}/1000
              </p>
              {commentError && (
                <p className="comment-form__error" role="alert">
                  {commentError}
                </p>
              )}
              {!commentError && commentSuccess && (
                <p className="comment-form__status" role="status" aria-live="polite">
                  {commentSuccess}
                </p>
              )}
              <button type="submit" className="comment-form__submit" disabled={commentStatus === 'sending'}>
                {commentStatus === 'sending' ? 'enviando…' : 'comentar'}
              </button>
            </form>
          </div>
          {(olderPost || newerPost) && (
            <nav className="post-nav" aria-label="Navegação entre pulsos">
              {olderPost ? (
                <Link to={`/posts/${olderPost.slug}`} className="post-nav__link post-nav__link--prev">
                  <span className="post-nav__label">← pulso anterior</span>
                  <span className="post-nav__title">{olderPost.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {newerPost && (
                <Link to={`/posts/${newerPost.slug}`} className="post-nav__link post-nav__link--next">
                  <span className="post-nav__label">próximo pulso →</span>
                  <span className="post-nav__title">{newerPost.title}</span>
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
