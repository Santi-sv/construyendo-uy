import { handleApi } from './api.mjs'
import { cloudStore } from './cloud-store.mjs'
import seed from './seed.json'
import assets from 'virtual:cms-assets'
let lastPrune = 0
export default {
  async fetch(request, bindings, context) {
    const url = new URL(request.url)
    if (url.protocol !== 'https:') { url.protocol = 'https:'; return Response.redirect(url.href, 308) }
    if (!bindings.DB || !bindings.BUCKET || !bindings.ADMIN_ORIGIN || !bindings.PUBLIC_SITE_URL) return new Response('Servicio pendiente de configuración.', { status: 503, headers: { 'Cache-Control': 'no-store' } })
    const env = { ...bindings, ...cloudStore(bindings), SEED: seed, DEV_MODE: false, CLIENT_IP: request.headers.get('CF-Connecting-IP') || 'unknown' }
    if (context?.waitUntil && Date.now() - lastPrune > 60_000) { lastPrune = Date.now(); context.waitUntil(env.STORE.purgeExpired().catch(() => {})) }
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/media/')) return handleApi(request, env)
    if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405 })
    if (['/', '/admin', '/admin/', '/admin.html'].includes(url.pathname)) {
      const base = bindings.PUBLIC_SITE_URL.endsWith('/') ? bindings.PUBLIC_SITE_URL : `${bindings.PUBLIC_SITE_URL}/`
      const panel = new URL('admin.html', base)
      // Evita reutilizar el HTML anterior de Pages que redirigía al servicio.
      panel.searchParams.set('v', 'github-pages')
      return new Response(null, { status: 302, headers: { Location: panel.href, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'Strict-Transport-Security': 'max-age=31536000' } })
    }
    const pathname = url.pathname
    const asset = assets[pathname]
    if (!asset) return new Response('Recurso no disponible.', { status: 404 })
    const payload = request.method === 'HEAD' ? null : Uint8Array.from(atob(asset.bytes), character => character.charCodeAt(0))
    return new Response(payload, { headers: { 'Content-Type': asset.type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Strict-Transport-Security': 'max-age=31536000', 'Referrer-Policy': 'no-referrer', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://santi-sv.github.io blob: data:; font-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'" } })
  },
}
