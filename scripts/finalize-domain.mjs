import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
const execute = promisify(execFile)
const origin = 'https://construyendo.uy'
const hostname = new URL(origin).hostname
const pagesPath = 'repos/Santi-sv/construyendo-uy/pages'
const cms = 'https://construyendo-uy-equipo.sam777-varela.chatgpt.site'
const expectedIps = new Set(['185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'])
const statusFile = path.resolve('.qa/domain-status.json')
const watch = process.argv.includes('--watch')
const deadline = Date.now() + 26 * 60 * 60_000
let previous = ''
async function github(...args) {
  const result = await execute('gh', ['api', ...args], { timeout: 20_000, maxBuffer: 256_000 })
  return result.stdout.trim() ? JSON.parse(result.stdout) : null
}
async function record(state, detail = {}) {
  const value = { domain: hostname, state, checkedAt: new Date().toISOString(), ...detail }
  await fs.mkdir(path.dirname(statusFile), { recursive: true })
  await fs.writeFile(statusFile, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 })
  if (previous !== state) { console.log(JSON.stringify(value)); previous = state }
}
async function fetchWithTimeout(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(12_000) })
}
async function finish() {
  const configuration = await github(pagesPath)
  if (configuration.cname !== hostname) { await record('stopped', { reason: 'El dominio de GitHub Pages cambió; no se modifica.' }); return true }
  const dns = await (await fetchWithTimeout(`https://dns.google/resolve?name=${hostname}&type=A`)).json()
  const ips = (dns.Answer || []).filter(item => item.type === 1).map(item => item.data)
  if (dns.Status !== 0 || !ips.length || ips.some(ip => !expectedIps.has(ip))) { await record('waiting_dns'); return false }
  let home
  try { home = await fetchWithTimeout(`${origin}/`) } catch { await record('waiting_certificate'); return false }
  const html = await home.text()
  if (!home.ok || new URL(home.url).origin !== origin || !html.includes('ConstruYENDO') || !html.includes(`href="${origin}/"`)) { await record('waiting_publication'); return false }
  if (!configuration.https_enforced) {
    const latest = await github(pagesPath)
    if (latest.cname !== hostname) { await record('stopped', { reason: 'El dominio cambió antes de aplicar HTTPS.' }); return true }
    try { await github('--method', 'PUT', pagesPath, '-F', 'https_enforced=true') } catch { await record('waiting_certificate'); return false }
  }
  const enforced = await github(pagesPath)
  if (!enforced.https_enforced) { await record('waiting_certificate'); return false }
  const [admin, publicContent, anonymous, cors] = await Promise.all([
    fetchWithTimeout(`${origin}/admin.html`),
    fetchWithTimeout(`${cms}/api/public/content`, { cache: 'no-store' }),
    fetchWithTimeout(`${cms}/api/admin/content`, { headers: { Origin: origin } }),
    fetchWithTimeout(`${cms}/api/admin/login`, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } }),
  ])
  const adminHtml = await admin.text()
  if (!admin.ok || !adminHtml.includes('Administración de imágenes') || !publicContent.ok || anonymous.status !== 401 || cors.status !== 204 || cors.headers.get('access-control-allow-origin') !== origin) { await record('waiting_site_checks'); return false }
  const content = await publicContent.json()
  const hero = content.hero?.image?.desktop?.large?.src
  if (!hero?.startsWith(`${origin}/images/`)) { await record('waiting_image_origin'); return false }
  const image = await fetchWithTimeout(hero, { method: 'HEAD' })
  if (!image.ok) { await record('waiting_images'); return false }
  const redirect = await fetchWithTimeout(`http://${hostname}/`, { redirect: 'manual' })
  if (![301, 302, 307, 308].includes(redirect.status) || !redirect.headers.get('location')?.startsWith(origin)) { await record('waiting_https_redirect'); return false }
  await record('complete', { website: `${origin}/`, panel: `${origin}/admin.html`, httpsEnforced: true, galleryPhotos: content.photos?.length, anonymousAccessBlocked: true })
  return true
}
do {
  try { if (await finish()) process.exit(0) } catch { await record('waiting_check_retry') }
  if (!watch) process.exit(2)
  if (Date.now() >= deadline) { await record('expired', { reason: 'Terminó la comprobación temporal de 26 horas.' }); process.exit(2) }
  await new Promise(resolve => setTimeout(resolve, 60_000))
} while (true)
