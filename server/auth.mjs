import { pbkdf2Async } from '@noble/hashes/pbkdf2.js'
import { sha256 } from '@noble/hashes/sha2.js'

const encoder = new TextEncoder()
const iterations = 600_000
export const sessionHours = 8
export const idleMinutes = 30
export const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('')
export const digest = async value => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)))
const hex = bytes => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('')
function constantEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let difference = 0
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return difference === 0
}
export function validCode(value) {
  return typeof value === 'string' && value.length >= 14 && value.length <= 128 && new Set(value).size >= 6 && !/^\d+$/.test(value)
}
async function derive(code, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(code), 'PBKDF2', false, ['deriveBits'])
  try {
    return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations }, key, 256))
  } catch (error) {
    if (error?.name !== 'NotSupportedError' || !/pbkdf2|iteration|100000/i.test(error.message)) throw error
    // Workers limita el PBKDF2 nativo. Se calcula el mismo PBKDF2 estándar,
    // con igual salt y 600.000 iteraciones, sin reducir el factor de trabajo.
    return hex(await pbkdf2Async(sha256, encoder.encode(code), encoder.encode(salt), { c: iterations, dkLen: 32, asyncTick: 10 }))
  }
}
export async function hashCode(code, version = 1) {
  if (!validCode(code)) throw new Error('El código debe tener entre 14 y 128 caracteres, con letras y variedad de caracteres.')
  const salt = randomToken()
  return { salt, hash: await derive(code, salt), version, algorithm: 'PBKDF2-SHA256', iterations }
}
export async function verifyCode(code, credential) {
  if (typeof code !== 'string' || code.length > 128 || !credential || credential.iterations !== iterations || credential.algorithm !== 'PBKDF2-SHA256') return false
  return constantEqual(await derive(code, credential.salt), credential.hash)
}
export function cookieName(env) { return env.DEV_MODE ? 'cy_admin_local' : '__Host-cy_admin' }
export function sessionCookie(env, token, maxAge = sessionHours * 3600) {
  return `${cookieName(env)}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${env.DEV_MODE ? '' : '; Secure'}`
}
export async function getCredential(env) {
  let raw = await env.STORE.get('credential')
  if (!raw && env.BOOTSTRAP_CREDENTIAL) {
    const parsed = JSON.parse(env.BOOTSTRAP_CREDENTIAL)
    if (parsed.algorithm !== 'PBKDF2-SHA256' || parsed.iterations !== iterations || !/^[a-f0-9]{64}$/.test(parsed.hash) || !/^[a-f0-9]{64}$/.test(parsed.salt)) throw new Error('Configuración de acceso inválida')
    await env.STORE.create('credential', JSON.stringify(parsed))
    raw = await env.STORE.get('credential')
  }
  return raw ? { raw, value: JSON.parse(raw) } : null
}
export function pagesOrigin(env) {
  try {
    const url = new URL(env.PUBLIC_SITE_URL)
    return url.protocol === 'https:' && url.origin !== new URL(env.ADMIN_ORIGIN).origin ? url.origin : null
  } catch { return null }
}
export const isPagesRequest = (request, env) => !!pagesOrigin(env) && request.headers.get('origin') === pagesOrigin(env)
export async function createSession(env, version, request) {
  const token = randomToken()
  const now = Date.now()
  const crossOrigin = request && isPagesRequest(request, env)
  const session = { csrf: randomToken(), version, createdAt: now, seenAt: now, expiresAt: now + sessionHours * 3600_000, ...(crossOrigin ? { transport: 'bearer', origin: pagesOrigin(env) } : {}) }
  await env.STORE.create(`session:${await digest(token)}`, JSON.stringify(session), session.expiresAt)
  return { session, ...(crossOrigin ? { sessionToken: token } : { cookie: sessionCookie(env, token) }) }
}
export async function authenticate(request, env) {
  const authorization = request.headers.get('authorization')
  const bearer = authorization !== null
  if (bearer ? !isPagesRequest(request, env) : isPagesRequest(request, env)) return null
  const token = bearer ? authorization.match(/^Bearer ([a-f0-9]{64})$/)?.[1] : (request.headers.get('cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName(env)}=`))?.split('=')[1]
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
  const key = `session:${await digest(token)}`
  const raw = await env.STORE.get(key)
  const credential = await getCredential(env)
  if (!raw || !credential) return null
  const session = JSON.parse(raw)
  if (bearer ? session.transport !== 'bearer' || session.origin !== request.headers.get('origin') : session.transport === 'bearer') return null
  const now = Date.now()
  if (session.version !== credential.value.version || now >= session.expiresAt || now - session.seenAt > idleMinutes * 60_000) {
    await env.STORE.delete(key)
    return null
  }
  if (now - session.seenAt > 60_000) await env.STORE.cas(key, raw, JSON.stringify({ ...session, seenAt: now }), session.expiresAt)
  return { ...session, key, credential }
}
export function validCsrf(request, session) { return constantEqual(request.headers.get('x-csrf-token'), session.csrf) }
export async function consumeLimit(env, key, limit, windowMs) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const raw = await env.STORE.get(key)
    const now = Date.now()
    const previous = raw ? JSON.parse(raw) : null
    const record = previous && previous.until > now ? previous : { count: 0, until: now + windowMs }
    if (record.count >= limit) return Math.ceil((record.until - now) / 1000)
    const next = JSON.stringify({ ...record, count: record.count + 1 })
    if (raw ? await env.STORE.cas(key, raw, next, record.until) : await env.STORE.create(key, next, record.until)) return 0
  }
  return 60
}
