const KEY = 'pulso-client-token'

// Token estável por navegador (não por sessão), só pra dedupe de sinalização
// de comentário no servidor — não identifica a pessoa, só o dispositivo.
export function getClientToken() {
  let token = localStorage.getItem(KEY)
  if (!token) {
    token = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(KEY, token)
  }
  return token
}
