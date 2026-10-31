import { authenticate, consumeLimit, createSession, digest, getCredential, hashCode, sessionCookie, validCode, validCsrf, verifyCode } from './auth.mjs'

class ApiError extends Error {
  constructor(status, message, headers = {}) { super(message); this.status = status; this.headers = headers }
}
const fail = (status, message, headers) => { throw new ApiError(status, message, headers) }
const categories = new Set(['banos', 'pisos', 'piscinas', 'piedra', 'escaleras'])
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/
const secureHeaders = {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', 'Strict-Transport-Security': 'max-age=31536000',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}
function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...secureHeaders, 'Content-Type': 'application/json; charset=utf-8', ...headers } })
}
function requireOrigin(request, env) {
  if (!env.ADMIN_ORIGIN || request.headers.get('origin') !== new URL(env.ADMIN_ORIGIN).origin) fail(403, 'Origen no autorizado.')
  if (!env.DEV_MODE && new URL(env.ADMIN_ORIGIN).protocol !== 'https:') fail(503, 'El panel requiere una conexión HTTPS.')
}
async function bytes(request, maximum) {
  const declared = Number(request.headers.get('content-length'))
  if (declared > maximum) fail(413, 'El archivo supera el tamaño permitido.')
  if (!request.body) return new Uint8Array()
  const reader = request.body.getReader()
  const chunks = []; let length = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    length += value.byteLength
    if (length > maximum) { await reader.cancel(); fail(413, 'El archivo supera el tamaño permitido.') }
    chunks.push(value)
  }
  const result = new Uint8Array(length); let offset = 0
  for (const part of chunks) { result.set(part, offset); offset += part.byteLength }
  return result
}
async function bodyJson(request, maximum = 256_000) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) fail(415, 'Se esperaba una solicitud JSON.')
  try { return JSON.parse(new TextDecoder().decode(await bytes(request, maximum))) } catch (error) {
    if (error instanceof ApiError) throw error
    fail(400, 'La solicitud no es válida.')
  }
}
async function readState(env) {
  let raw = await env.STORE.get('content')
  if (!raw) {
    const initial = { photos: env.SEED.photos, locations: env.SEED.locations.map(({ id, caption }) => ({ id, caption, mediaId: null })), hero: env.SEED.hero }
    await env.STORE.create('content', JSON.stringify({ revision: 0, publishedRevision: 0, publishedAt: null, draft: initial, published: initial }))
    raw = await env.STORE.get('content')
  }
  return { raw, value: JSON.parse(raw) }
}
const siteAsset = (env, file) => new URL(file.replace(/^\//, ''), env.PUBLIC_SITE_URL.endsWith('/') ? env.PUBLIC_SITE_URL : `${env.PUBLIC_SITE_URL}/`).href
async function imageInfo(env, id, mediaId, privateView) {
  if (!mediaId) {
    const size = env.SEED.dimensions[id]
    if (!size) fail(400, 'La foto original no existe.')
    return { small: siteAsset(env, `images/retocadas/${id}-640.webp`), large: siteAsset(env, `images/retocadas/${id}-grande.webp`), ...size }
  }
  const raw = await env.STORE.get(`media:${mediaId}`)
  if (!raw) fail(400, 'La imagen cargada no está disponible.')
  const media = JSON.parse(raw)
  const prefix = privateView ? '/api/admin/media/' : '/media/'
  return { small: new URL(`${prefix}${mediaId}/small.jpg`, env.ADMIN_ORIGIN).href, large: new URL(`${prefix}${mediaId}/large.jpg`, env.ADMIN_ORIGIN).href, width: media.width, height: media.height, smallWidth: media.smallWidth, smallHeight: media.smallHeight }
}
async function serializeContent(env, content, privateView = false) {
  const photos = await Promise.all(content.photos.map(async photo => ({ ...photo, image: await imageInfo(env, photo.id, photo.mediaId, privateView) })))
  let heroImage
  if (content.hero.mediaId) {
    const image = await imageInfo(env, '', content.hero.mediaId, privateView)
    heroImage = { desktop: { small: { src: image.small, width: image.smallWidth || Math.min(640, image.width), height: image.smallHeight || Math.round(image.height * Math.min(640, image.width) / image.width) }, large: { src: image.large, width: image.width, height: image.height } }, mobile: { small: { src: image.small, width: image.smallWidth || Math.min(640, image.width), height: image.smallHeight || Math.round(image.height * Math.min(640, image.width) / image.width) }, large: { src: image.large, width: image.width, height: image.height } } }
  } else {
    heroImage = Object.fromEntries(Object.entries(env.SEED.heroImage).map(([device, variants]) => [device, Object.fromEntries(Object.entries(variants).map(([size, image]) => [size, { ...image, src: siteAsset(env, image.src) }]))]))
  }
  const locations = await Promise.all(content.locations.map(async item => {
    const original = env.SEED.locations.find(place => place.id === item.id)
    const image = item.mediaId ? await imageInfo(env, '', item.mediaId, privateView) : { small: siteAsset(env, `images/localidades/${original.file}`), large: siteAsset(env, `images/localidades/${original.file}`), width: 640, height: 440 }
    return { ...item, label: original.label, image, ...(item.mediaId ? {} : { source: original.source, license: original.license, licenseUrl: original.licenseUrl }) }
  }))
  return { schemaVersion: 1, photos, locations, hero: { ...content.hero, image: heroImage } }
}
async function adminContent(env, state) {
  return { ...await serializeContent(env, state.draft, true), revision: state.revision, publishedRevision: state.publishedRevision, publishedAt: state.publishedAt, hasUnpublishedChanges: JSON.stringify(state.draft) !== JSON.stringify(state.published) }
}
async function validateContent(input, env) {
  if (!input || !Array.isArray(input.photos) || input.photos.length < 1 || input.photos.length > 200) fail(400, 'La galería admite entre 1 y 200 fotos.')
  const seen = new Set()
  const photos = []
  for (const photo of input.photos) {
    if (!photo || typeof photo.id !== 'string' || !/^[a-z0-9-]{1,90}$/.test(photo.id) || seen.has(photo.id)) fail(400, 'Hay una foto inválida o repetida.')
    seen.add(photo.id)
    const original = env.SEED.photos.find(item => item.id === photo.id)
    if (!original && !photo.id.startsWith('foto-')) fail(400, 'Identificador de foto no válido.')
    if (!categories.has(photo.category) || typeof photo.description !== 'string' || !photo.description.trim() || photo.description.length > 180 || typeof photo.visible !== 'boolean') fail(400, 'Revisá la categoría y descripción de cada foto.')
    if (photo.mediaId !== null && (typeof photo.mediaId !== 'string' || !uuid.test(photo.mediaId) || !await env.STORE.get(`media:${photo.mediaId}`))) fail(400, 'La imagen cargada no existe.')
    if (!original && !photo.mediaId) fail(400, 'La nueva foto necesita una imagen.')
    photos.push({ ...(original || {}), id: photo.id, category: photo.category, description: photo.description.trim(), mediaId: photo.mediaId, visible: original?.detailOf || original?.auxiliary ? false : photo.visible })
  }
  // Las referencias de las otras secciones y las tomas complementarias se conservan.
  if (env.SEED.photos.some(original => !seen.has(original.id))) fail(400, 'Las fotos originales se pueden reemplazar u ocultar, pero se conservan sus referencias.')
  if (!photos.some(photo => photo.visible && !photo.detailOf && !photo.auxiliary)) fail(400, 'Dejá al menos una foto visible en la galería.')
  const hero = input.hero
  if (!hero || !['real', 'illustrative'].includes(hero.kind) || typeof hero.alt !== 'string' || !hero.alt.trim() || hero.alt.length > 240) fail(400, 'Revisá la descripción de la portada.')
  if (hero.mediaId !== null && (typeof hero.mediaId !== 'string' || !uuid.test(hero.mediaId) || !await env.STORE.get(`media:${hero.mediaId}`))) fail(400, 'La imagen de portada no existe.')
  if (!Array.isArray(input.locations) || input.locations.length !== env.SEED.locations.length) fail(400, 'Revisá las imágenes de localidades.')
  const locationIds = new Set()
  const locations = []
  for (const item of input.locations) {
    if (!item || !env.SEED.locations.some(place => place.id === item.id) || locationIds.has(item.id) || typeof item.caption !== 'string' || item.caption.length > 80) fail(400, 'Revisá las imágenes de localidades.')
    if (item.mediaId !== null && (typeof item.mediaId !== 'string' || !uuid.test(item.mediaId) || !await env.STORE.get(`media:${item.mediaId}`))) fail(400, 'La imagen de localidad no existe.')
    locationIds.add(item.id); locations.push({ id: item.id, caption: item.caption.trim(), mediaId: item.mediaId })
  }
  return { photos, locations, hero: { mediaId: hero.mediaId, kind: hero.kind, alt: hero.alt.trim() } }
}
// Solo JPEG normalizado, con medidas acotadas y sin EXIF, XMP, IPTC ni comentarios.
export function jpegInfo(data, maxSide) {
  if (data.length < 32 || data[0] !== 255 || data[1] !== 216 || data.at(-2) !== 255 || data.at(-1) !== 217) fail(415, 'No es una imagen JPEG válida.')
  let offset = 2; let dimensions = null
  while (offset < data.length - 2) {
    if (data[offset++] !== 255) fail(415, 'Imagen no válida.')
    while (data[offset] === 255) offset++
    const marker = data[offset++]
    if (marker === 0xda) break
    if (marker === 0xe1 || marker === 0xed || marker === 0xfe) fail(415, 'La imagen debe procesarse antes de cargarla.')
    if (offset + 2 > data.length) fail(415, 'Imagen incompleta.')
    const length = data[offset] * 256 + data[offset + 1]
    if (length < 2 || offset + length > data.length) fail(415, 'Imagen incompleta.')
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      if (length < 8) fail(415, 'Imagen incompleta.')
      dimensions = { height: data[offset + 3] * 256 + data[offset + 4], width: data[offset + 5] * 256 + data[offset + 6] }
    }
    offset += length
  }
  if (!dimensions || dimensions.width < 32 || dimensions.height < 32 || dimensions.width > maxSide || dimensions.height > maxSide) fail(415, 'Las dimensiones de la imagen no son válidas.')
  return dimensions
}
async function upload(request, env, session) {
  const retry = await consumeLimit(env, `uploads:${session.version}`, 30, 60_000)
  if (retry) fail(429, 'Esperá un momento antes de cargar más fotos.', { 'Retry-After': String(retry) })
  if (!request.headers.get('content-type')?.startsWith('multipart/form-data;')) fail(415, 'Se esperaba una imagen.')
  const payload = await bytes(request, 6_000_000)
  let form
  try { form = await new Response(payload, { headers: { 'Content-Type': request.headers.get('content-type') } }).formData() } catch { fail(400, 'La carga no es válida.') }
  const small = form.get('small'); const large = form.get('large')
  if (!small || !large || typeof small.arrayBuffer !== 'function' || typeof large.arrayBuffer !== 'function' || small.size > 1_000_000 || large.size > 4_000_000) fail(413, 'La imagen supera el tamaño permitido.')
  const smallBytes = new Uint8Array(await small.arrayBuffer()); const largeBytes = new Uint8Array(await large.arrayBuffer())
  const smallInfo = jpegInfo(smallBytes, 640); const largeInfo = jpegInfo(largeBytes, 2000)
  if (Math.abs(smallInfo.width / smallInfo.height - largeInfo.width / largeInfo.height) > 0.02) fail(400, 'Las versiones de la imagen no coinciden.')
  const quota = await consumeLimit(env, 'media-quota', 200, 10 * 365 * 24 * 3600_000)
  if (quota) fail(409, 'Se alcanzó el límite de 200 imágenes cargadas.')
  const id = crypto.randomUUID()
  await env.FILES.put(`${id}/small.jpg`, smallBytes)
  await env.FILES.put(`${id}/large.jpg`, largeBytes)
  await env.STORE.create(`media:${id}`, JSON.stringify({ ...largeInfo, smallWidth: smallInfo.width, smallHeight: smallInfo.height, createdAt: new Date().toISOString() }))
  return json({ id, image: await imageInfo(env, '', id, true) }, 201)
}
async function serveImage(request, env, id, size, session) {
  if (!uuid.test(id) || !['small', 'large'].includes(size)) fail(404, 'Imagen no disponible.')
  if (!session) {
    const { value } = await readState(env)
    if (value.published.hero.mediaId !== id && !value.published.photos.some(photo => photo.mediaId === id) && !value.published.locations.some(place => place.mediaId === id)) fail(404, 'Imagen no disponible.')
  }
  const image = await env.FILES.get(`${id}/${size}.jpg`)
  if (!image) fail(404, 'Imagen no disponible.')
  return new Response(request.method === 'HEAD' ? null : image, { headers: { ...secureHeaders, 'Content-Type': 'image/jpeg', 'Content-Disposition': 'inline', 'Cache-Control': session ? 'no-store' : 'public, max-age=86400', 'Cross-Origin-Resource-Policy': 'cross-origin' } })
}
export async function handleApi(request, env) {
  try {
    const url = new URL(request.url); const path = url.pathname
    if (!env.DEV_MODE && (url.protocol !== 'https:' || !env.ADMIN_ORIGIN?.startsWith('https://'))) fail(503, 'El servicio requiere HTTPS.')
    if (path === '/api/public/content' && request.method === 'GET') {
      const { value } = await readState(env)
      return json({ ...await serializeContent(env, value.published), revision: value.publishedRevision, publishedAt: value.publishedAt }, 200, { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=30' })
    }
    const publicImage = path.match(/^\/media\/([^/]+)\/(small|large)\.jpg$/)
    if (publicImage && ['GET', 'HEAD'].includes(request.method)) return await serveImage(request, env, publicImage[1], publicImage[2], null)
    if (!path.startsWith('/api/admin/')) fail(404, 'Recurso no disponible.')
    if (!['GET', 'HEAD'].includes(request.method)) requireOrigin(request, env)
    if (path === '/api/admin/login' && request.method === 'POST') {
      const input = await bodyJson(request, 1024)
      const retry = await consumeLimit(env, `login:${await digest(env.CLIENT_IP || 'unknown')}`, 5, 15 * 60_000)
      if (retry) fail(429, 'Demasiados intentos. Volvé a intentar más tarde.', { 'Retry-After': String(retry) })
      const globalRetry = await consumeLimit(env, 'login-global', 60, 60_000)
      if (globalRetry) fail(429, 'Esperá un momento e intentá nuevamente.', { 'Retry-After': String(globalRetry) })
      const credential = await getCredential(env)
      if (!credential) fail(503, 'El acceso todavía no fue configurado por el responsable del sitio.')
      if (!await verifyCode(input?.code, credential.value)) fail(401, 'El código no es correcto.')
      const current = await getCredential(env)
      if (current.raw !== credential.raw) fail(401, 'El código cambió. Volvé a ingresar.')
      const { session, cookie } = await createSession(env, credential.value.version)
      return json({ csrf: session.csrf, expiresAt: session.expiresAt }, 200, { 'Set-Cookie': cookie })
    }
    const session = await authenticate(request, env)
    if (!session) fail(401, 'Ingresá con el código de acceso.')
    if (!['GET', 'HEAD'].includes(request.method) && !validCsrf(request, session)) fail(403, 'La sesión debe actualizarse. Volvé a ingresar.')
    if (path === '/api/admin/session' && request.method === 'GET') return json({ csrf: session.csrf, expiresAt: session.expiresAt })
    if (path === '/api/admin/logout' && request.method === 'POST') {
      await env.STORE.delete(session.key)
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(env, '', 0) })
    }
    const privateImage = path.match(/^\/api\/admin\/media\/([^/]+)\/(small|large)\.jpg$/)
    if (privateImage && ['GET', 'HEAD'].includes(request.method)) return await serveImage(request, env, privateImage[1], privateImage[2], session)
    if (path === '/api/admin/media' && request.method === 'POST') return await upload(request, env, session)
    if (path === '/api/admin/code' && request.method === 'POST') {
      const input = await bodyJson(request, 2048)
      const retry = await consumeLimit(env, `change-code:${session.version}`, 5, 15 * 60_000)
      if (retry) fail(429, 'Demasiados intentos. Volvé a intentar más tarde.', { 'Retry-After': String(retry) })
      if (!await verifyCode(input?.currentCode, session.credential.value)) fail(401, 'El código actual no es correcto.')
      if (!validCode(input?.newCode)) fail(400, 'Usá al menos 14 caracteres, con letras y variedad de caracteres.')
      if (input.newCode === input.currentCode) fail(400, 'Elegí un código diferente al actual.')
      const credential = await hashCode(input.newCode, session.version + 1)
      if (!await env.STORE.cas('credential', session.credential.raw, JSON.stringify(credential))) fail(409, 'El código ya cambió en otra sesión. Volvé a ingresar.')
      await env.STORE.delete(session.key)
      const next = await createSession(env, credential.version)
      return json({ csrf: next.session.csrf, expiresAt: next.session.expiresAt }, 200, { 'Set-Cookie': next.cookie })
    }
    if (path === '/api/admin/content' && request.method === 'GET') return json(await adminContent(env, (await readState(env)).value))
    if ((path === '/api/admin/content' && request.method === 'PUT') || (path === '/api/admin/publish' && request.method === 'POST')) {
      const input = await bodyJson(request)
      const previous = await readState(env)
      if (!input || input.revision !== previous.value.revision) fail(409, 'Hay cambios más recientes. Recargá el panel antes de continuar.')
      const next = { ...previous.value, revision: previous.value.revision + 1 }
      if (path.endsWith('/publish')) { next.published = previous.value.draft; next.publishedRevision++; next.publishedAt = new Date().toISOString() }
      else next.draft = await validateContent(input, env)
      if (!await env.STORE.cas('content', previous.raw, JSON.stringify(next))) fail(409, 'Otra sesión guardó cambios. Recargá el panel.')
      return json(await adminContent(env, next))
    }
    fail(404, 'Recurso no disponible.')
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status, error.headers)
    // No se registran códigos, cookies, cuerpos de solicitudes ni datos personales.
    console.error('CMS: la operación no pudo completarse.', error?.name || 'Error')
    return json({ error: 'No pudimos completar la operación. Intentá nuevamente.' }, 500)
  }
}
