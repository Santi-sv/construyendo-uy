import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { handleApi } from './api.mjs'
import { digest, hashCode } from './auth.mjs'
import { localStore } from './local-store.mjs'
const seed = JSON.parse(await fs.readFile(new URL('./seed.json', import.meta.url), 'utf8'))
const origin = 'https://cms.example.test'
const code = 'Ensayo de acceso privado 2026'
async function fixture(context, configured = true, publicSite = 'https://santi-sv.github.io/construyendo-uy/') {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'cy-cms-test-'))
  context.after(() => fs.rm(directory, { recursive: true, force: true }))
  const storage = await localStore(directory)
  const env = { ...storage, SEED: seed, ADMIN_ORIGIN: origin, PUBLIC_SITE_URL: publicSite, CLIENT_IP: 'test-client', DEV_MODE: false }
  if (configured) await env.STORE.create('credential', JSON.stringify(await hashCode(code)))
  async function call(route, { method = 'GET', body, cookie, csrf, requestOrigin = origin, headers = {} } = {}) {
    const request = new Request(`${origin}${route}`, { method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(method === 'GET' ? {} : { Origin: requestOrigin }), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    return handleApi(request, env)
  }
  async function login(value = code) {
    const response = await call('/api/admin/login', { method: 'POST', body: { code: value } })
    assert.equal(response.status, 200)
    return { cookie: response.headers.get('set-cookie').split(';')[0], csrf: (await response.json()).csrf, header: response.headers.get('set-cookie') }
  }
  return { env, call, login, directory }
}
const clean = content => ({ revision: content.revision, photos: content.photos, locations: content.locations, hero: content.hero })

test('ninguna operación de administración acepta acceso anónimo ni origen ajeno', async context => {
  const { call } = await fixture(context)
  for (const [route, method, body] of [['session', 'GET'], ['content', 'GET'], ['content', 'PUT', {}], ['publish', 'POST', {}], ['code', 'POST', {}], ['logout', 'POST', {}], ['media', 'POST', {}], ['media/00000000-0000-0000-0000-000000000000/large.jpg', 'GET']]) {
    assert.equal((await call(`/api/admin/${route}`, { method, body })).status, 401, route)
  }
  assert.equal((await call('/api/admin/login', { method: 'POST', body: { code }, requestOrigin: 'https://ajeno.example' })).status, 403)
  assert.equal((await call('/api/admin/login', { method: 'POST', body: { code }, requestOrigin: 'null' })).status, 403)
})

test('configuración ausente cierra el acceso; cookies y almacenamiento no exponen el código', async context => {
  const unconfigured = await fixture(context, false)
  assert.equal((await unconfigured.call('/api/admin/login', { method: 'POST', body: { code } })).status, 503)
  const { login, directory, call } = await fixture(context)
  const session = await login()
  assert.match(session.header, /^__Host-cy_admin=/)
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/']) assert.ok(session.header.includes(flag))
  assert.ok(!(await fs.readFile(path.join(directory, 'private-state.json'), 'utf8')).includes(code))
  assert.equal((await call('/api/admin/publish', { method: 'POST', cookie: session.cookie, body: { revision: 0 } })).status, 403)
  assert.equal((await call('/api/admin/publish', { method: 'POST', ...session, body: { revision: 0 }, requestOrigin: 'https://ajeno.example' })).status, 403)
})

test('los intentos concurrentes se limitan y el bloqueo persiste', async context => {
  const { call, directory } = await fixture(context)
  const responses = await Promise.all(Array.from({ length: 7 }, () => call('/api/admin/login', { method: 'POST', body: { code: 'incorrecto' } })))
  assert.equal(responses.filter(response => response.status === 401).length, 5)
  assert.equal(responses.filter(response => response.status === 429).length, 2)
  const storage = await localStore(directory)
  const rate = await storage.STORE.get(`login:${await digest('test-client')}`)
  assert.equal(JSON.parse(rate).count, 5)
})

test('cambiar el código revoca todas las sesiones anteriores y exige el código actual', async context => {
  const { call, login } = await fixture(context)
  const a = await login(); const b = await login()
  assert.equal((await call('/api/admin/code', { method: 'POST', ...a, body: { currentCode: 'no válido', newCode: 'Otra frase privada 2026' } })).status, 401)
  assert.equal((await call('/api/admin/code', { method: 'POST', ...a, body: { currentCode: code, newCode: '1234567890123456' } })).status, 400)
  const response = await call('/api/admin/code', { method: 'POST', ...a, body: { currentCode: code, newCode: 'Otra frase privada 2026' } })
  assert.equal(response.status, 200)
  const cookie = response.headers.get('set-cookie').split(';')[0]
  for (const old of [a, b]) assert.equal((await call('/api/admin/content', { cookie: old.cookie })).status, 401)
  assert.equal((await call('/api/admin/content', { cookie })).status, 200)
  assert.equal((await call('/api/admin/login', { method: 'POST', body: { code } })).status, 401)
  await login('Otra frase privada 2026')
})

test('las sesiones vencen por inactividad y por tiempo absoluto', async context => {
  const { call, login, env } = await fixture(context)
  for (const expired of ['idle', 'absolute']) {
    const session = await login()
    const key = `session:${await digest(session.cookie.split('=')[1])}`
    const raw = await env.STORE.get(key); const value = JSON.parse(raw)
    if (expired === 'idle') value.seenAt = Date.now() - 31 * 60_000
    else value.expiresAt = Date.now() - 1
    await env.STORE.cas(key, raw, JSON.stringify(value), Date.now() + 100_000)
    assert.equal((await call('/api/admin/content', { cookie: session.cookie })).status, 401)
  }
})

test('borradores privados, rechazo de archivos y publicación consistente con control de revisiones', async context => {
  const { call, login, env } = await fixture(context)
  const session = await login()
  const initial = await (await call('/api/admin/content', { cookie: session.cookie })).json()
  async function upload(smallBytes, largeBytes) {
    const form = new FormData(); form.append('small', new Blob([smallBytes], { type: 'image/jpeg' }), 'small.jpg'); form.append('large', new Blob([largeBytes], { type: 'image/jpeg' }), 'large.jpg')
    return handleApi(new Request(`${origin}/api/admin/media`, { method: 'POST', headers: { Origin: origin, Cookie: session.cookie, 'X-CSRF-Token': session.csrf }, body: form }), env)
  }
  const small = await sharp({ create: { width: 64, height: 48, channels: 3, background: '#cbb496' } }).jpeg().toBuffer()
  const large = await sharp({ create: { width: 128, height: 96, channels: 3, background: '#cbb496' } }).jpeg().toBuffer()
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
  assert.equal((await upload(svg, svg)).status, 415)
  const exif = Buffer.concat([large.subarray(0, 2), Buffer.from([255, 225, 0, 8, 69, 120, 105, 102, 0, 0]), large.subarray(2)])
  assert.equal((await upload(small, exif)).status, 415)
  const uploadedResponse = await upload(small, large)
  assert.equal(uploadedResponse.status, 201)
  const uploaded = await uploadedResponse.json()
  const publicPath = `/media/${uploaded.id}/large.jpg`
  assert.equal((await call(publicPath)).status, 404)
  assert.equal((await call(new URL(uploaded.image.large).pathname)).status, 401)
  initial.photos[0].description = 'Trabajo actualizado desde el borrador'
  initial.photos[0].mediaId = uploaded.id
  initial.locations[0].mediaId = uploaded.id
  initial.hero.mediaId = uploaded.id; initial.hero.kind = 'real'; initial.hero.alt = 'Obra real de prueba'
  const savedResponse = await call('/api/admin/content', { method: 'PUT', ...session, body: clean(initial) })
  assert.equal(savedResponse.status, 200)
  const saved = await savedResponse.json()
  assert.equal(saved.hasUnpublishedChanges, true)
  const before = await (await call('/api/public/content')).json()
  assert.notEqual(before.photos[0].description, initial.photos[0].description)
  assert.equal((await call(publicPath)).status, 404)
  assert.equal((await call('/api/admin/content', { method: 'PUT', ...session, body: clean(initial) })).status, 409)
  const publishedResponse = await call('/api/admin/publish', { method: 'POST', ...session, body: { revision: saved.revision } })
  assert.equal(publishedResponse.status, 200)
  const published = await (await call('/api/public/content')).json()
  assert.equal(published.photos[0].description, initial.photos[0].description)
  assert.equal(published.hero.kind, 'real')
  assert.equal(published.locations[0].source, undefined)
  const image = await call(publicPath)
  assert.equal(image.status, 200); assert.equal(image.headers.get('content-type'), 'image/jpeg'); assert.equal(image.headers.get('x-content-type-options'), 'nosniff')
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), large)
  const latest = await (await call('/api/admin/content', { cookie: session.cookie })).json()
  const writes = await Promise.all([1, 2].map(number => call('/api/admin/content', { method: 'PUT', ...session, body: { ...clean(latest), photos: latest.photos.map((photo, index) => index ? photo : { ...photo, description: `Cambio concurrente ${number}` }) } })))
  assert.deepEqual(writes.map(response => response.status).sort(), [200, 409])
})

test('datos maliciosos, referencias rotas y tamaños excesivos se rechazan', async context => {
  const { call, login } = await fixture(context)
  const session = await login()
  const initial = await (await call('/api/admin/content', { cookie: session.cookie })).json()
  for (const input of [
    { ...clean(initial), photos: initial.photos.slice(1) },
    { ...clean(initial), photos: initial.photos.map(photo => ({ ...photo, visible: false })) },
    { ...clean(initial), photos: initial.photos.map((photo, index) => index ? photo : { ...photo, category: 'admin' }) },
    { ...clean(initial), hero: { ...initial.hero, mediaId: '../../credential' } },
    { ...clean(initial), locations: [] },
  ]) assert.equal((await call('/api/admin/content', { method: 'PUT', ...session, body: input })).status, 400)
  assert.equal((await call('/api/admin/content', { method: 'PUT', ...session, body: { payload: 'x'.repeat(300_000) } })).status, 413)
  assert.equal((await call('/api/admin/logout', { method: 'POST', ...session, body: {} })).status, 200)
  assert.equal((await call('/api/admin/content', { cookie: session.cookie })).status, 401)
})

test('dos instancias locales no pierden credenciales ni cambios al escribir a la vez', async context => {
  const { directory, env } = await fixture(context)
  const second = await localStore(directory)
  assert.deepEqual(await Promise.all([env.STORE.create('parallel-a', 'first'), second.STORE.create('parallel-b', 'second')]), [true, true])
  assert.equal(await env.STORE.get('parallel-b'), 'second')
  assert.equal(await second.STORE.get('parallel-a'), 'first')
  assert.ok(await second.STORE.get('credential'))
})

test('el límite nativo de Workers conserva exactamente el mismo PBKDF2 de 600.000 iteraciones', async context => {
  const { verifyCode } = await import('./auth.mjs')
  const credential = await hashCode(code)
  context.mock.method(crypto.subtle, 'deriveBits', async () => { throw new DOMException('PBKDF2 iteration counts above 100000 are not supported', 'NotSupportedError') })
  assert.equal(await verifyCode(code, credential), true)
  assert.equal(await verifyCode('Otra clave que no corresponde', credential), false)
})

test('el panel en Pages usa una sesión en memoria ligada al origen, sin cookies de terceros', async context => {
  const { call, login, env } = await fixture(context)
  const pages = 'https://santi-sv.github.io'
  const response = await call('/api/admin/login', { method: 'POST', requestOrigin: pages, body: { code } })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('access-control-allow-origin'), pages)
  assert.equal(response.headers.get('vary'), 'Origin')
  assert.equal(response.headers.get('access-control-allow-credentials'), null)
  assert.equal(response.headers.get('set-cookie'), null)
  const session = await response.json()
  assert.match(session.sessionToken, /^[a-f0-9]{64}$/)
  const auth = { headers: { Origin: pages, Authorization: `Bearer ${session.sessionToken}` } }
  assert.equal((await call('/api/admin/content', auth)).status, 200)
  const persisted = JSON.parse(await env.STORE.get(`session:${await digest(session.sessionToken)}`))
  assert.equal(persisted.origin, pages)
  assert.equal(persisted.transport, 'bearer')
  assert.equal((await call('/api/admin/content', { headers: { Authorization: `Bearer ${session.sessionToken}` } })).status, 401)
  assert.equal((await call('/api/admin/content', { headers: { Origin: origin, Authorization: `Bearer ${session.sessionToken}` } })).status, 401)
  assert.equal((await call('/api/admin/content', { cookie: `__Host-cy_admin=${session.sessionToken}` })).status, 401)
  const cookieSession = await login()
  assert.equal((await call('/api/admin/content', { cookie: cookieSession.cookie, headers: { Origin: pages } })).status, 401)
  assert.equal((await call('/api/admin/content', { headers: { Origin: pages, Authorization: `Bearer ${cookieSession.cookie.split('=')[1]}` } })).status, 401)
  const initial = await (await call('/api/admin/content', auth)).json()
  assert.equal((await call('/api/admin/content', { ...auth, method: 'PUT', requestOrigin: pages, body: clean(initial) })).status, 403)
  const saved = await call('/api/admin/content', { ...auth, method: 'PUT', requestOrigin: pages, csrf: session.csrf, body: clean(initial) })
  assert.equal(saved.status, 200)
  const rotated = await call('/api/admin/code', { ...auth, method: 'POST', requestOrigin: pages, csrf: session.csrf, body: { currentCode: code, newCode: 'Un nuevo acceso de prueba 2026' } })
  assert.equal(rotated.status, 200)
  assert.equal(rotated.headers.get('set-cookie'), null)
  const next = await rotated.json()
  assert.match(next.sessionToken, /^[a-f0-9]{64}$/)
  assert.notEqual(next.sessionToken, session.sessionToken)
  assert.equal((await call('/api/admin/content', auth)).status, 401)
  const nextAuth = { headers: { Origin: pages, Authorization: `Bearer ${next.sessionToken}` } }
  assert.equal((await call('/api/admin/content', nextAuth)).status, 200)
  assert.equal((await call('/api/admin/logout', { ...nextAuth, method: 'POST', requestOrigin: pages, csrf: next.csrf, body: {} })).status, 200)
  assert.equal((await call('/api/admin/content', nextAuth)).status, 401)
})

test('CORS administrativo rechaza orígenes, métodos y cabeceras ajenos y mantiene privadas las fotos', async context => {
  const { call, env } = await fixture(context)
  const pages = 'https://santi-sv.github.io'
  const preflight = { method: 'OPTIONS', requestOrigin: pages, headers: { 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization, content-type, x-csrf-token' } }
  const accepted = await call('/api/admin/content', preflight)
  assert.equal(accepted.status, 204)
  assert.equal(accepted.headers.get('access-control-allow-origin'), pages)
  for (const requestOrigin of ['https://ajeno.example', 'https://santi-sv.github.io.ajeno.example', 'http://santi-sv.github.io', 'null']) {
    const rejected = await call('/api/admin/content', { ...preflight, requestOrigin })
    assert.equal(rejected.status, 403)
    assert.equal(rejected.headers.get('access-control-allow-origin'), null)
  }
  assert.equal((await call('/api/admin/content', { ...preflight, headers: { 'Access-Control-Request-Method': 'DELETE' } })).status, 403)
  assert.equal((await call('/api/admin/content', { ...preflight, headers: { 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'x-foreign-header' } })).status, 403)
  const loggedIn = await (await call('/api/admin/login', { method: 'POST', requestOrigin: pages, body: { code } })).json()
  const headers = { Origin: pages, Authorization: `Bearer ${loggedIn.sessionToken}`, 'X-CSRF-Token': loggedIn.csrf }
  const image = await sharp({ create: { width: 64, height: 48, channels: 3, background: '#cbb496' } }).jpeg().toBuffer()
  const form = new FormData(); for (const size of ['small', 'large']) form.append(size, new Blob([image], { type: 'image/jpeg' }), `${size}.jpg`)
  const upload = await handleApi(new Request(`${origin}/api/admin/media`, { method: 'POST', headers, body: form }), env)
  assert.equal(upload.status, 201)
  const { id } = await upload.json()
  const privatePath = `/api/admin/media/${id}/small.jpg`
  assert.equal((await call(privatePath, { headers })).status, 200)
  assert.equal((await call(privatePath)).status, 401)
  assert.equal((await call(`/media/${id}/small.jpg`)).status, 404)
  const blocked = await call(privatePath, { headers: { ...headers, Origin: 'https://ajeno.example' } })
  assert.equal(blocked.status, 403)
  assert.equal(blocked.headers.get('access-control-allow-origin'), null)
})

test('el dominio propio recibe imágenes y acceso privado sin autorizar el origen anterior', async context => {
  const { call } = await fixture(context, true, 'https://construyendo.uy/')
  const site = 'https://construyendo.uy'
  const login = await call('/api/admin/login', { method: 'POST', requestOrigin: site, body: { code } })
  assert.equal(login.status, 200)
  assert.equal(login.headers.get('access-control-allow-origin'), site)
  assert.equal(login.headers.get('set-cookie'), null)
  const session = await login.json()
  const headers = { Origin: site, Authorization: `Bearer ${session.sessionToken}` }
  const content = await call('/api/admin/content', { headers })
  assert.equal(content.status, 200)
  const data = await content.json()
  assert.ok(data.photos.every(photo => photo.image.small.startsWith(`${site}/images/`)))
  assert.ok(data.locations.every(place => place.image.small.startsWith(`${site}/images/`)))
  assert.ok(data.hero.image.desktop.large.src.startsWith(`${site}/images/`))
  const oldOrigin = await call('/api/admin/content', { headers: { ...headers, Origin: 'https://santi-sv.github.io' } })
  assert.equal(oldOrigin.status, 403)
  assert.equal(oldOrigin.headers.get('access-control-allow-origin'), null)
  assert.equal((await call('/api/admin/content')).status, 401)
})
