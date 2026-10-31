import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
const source = await readFile(new URL('../src/lib/privacy.ts', import.meta.url), 'utf8')
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const privacy = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`)
const now = Date.now()
const choice = preferences => `${privacy.privacyCookie}=${encodeURIComponent(JSON.stringify({ version: 1, preferences, savedAt: now }))}`
assert.equal(privacy.parsePrivacy('', now), null)
assert.equal(privacy.parsePrivacy('__Host-cy_admin=no-es-una-preferencia', now), null)
assert.equal(privacy.parsePrivacy(`${privacy.privacyCookie}=%ZZ`, now), null)
for (const invalid of [{ version: 2, preferences: true, savedAt: now }, { version: 1, preferences: 'true', savedAt: now }, { version: 1, preferences: true, savedAt: now + 600_000 }, { version: 1, preferences: true, savedAt: now - 181 * 24 * 3600_000 }]) {
  assert.equal(privacy.parsePrivacy(`${privacy.privacyCookie}=${encodeURIComponent(JSON.stringify(invalid))}`, now), null)
}
assert.equal(privacy.parsePrivacy(choice(false), now).preferences, false)
assert.equal(privacy.parsePrivacy(`otra=si; ${choice(true)}`, now).preferences, true)
let cookie = '', written = ''
globalThis.document = { get cookie() { return cookie }, set cookie(value) { written = value; cookie = value.split(';')[0] } }
globalThis.location = { hostname: 'construyendo.uy', protocol: 'https:' }
const stored = new Map()
globalThis.localStorage = { setItem: (key, value) => stored.set(key, value), removeItem: key => stored.delete(key) }
const events = []
globalThis.window = { dispatchEvent: event => events.push(event.type) }
privacy.rememberCategory('banos')
assert.equal(stored.size, 0, 'No se guardan preferencias sin permiso.')
privacy.savePrivacy(true)
for (const attribute of ['Max-Age=15552000', 'Path=/', 'SameSite=Lax', 'Secure']) assert.ok(written.includes(attribute), attribute)
assert.ok(!written.includes('Domain='), 'La cookie es solo del dominio actual.')
privacy.rememberCategory('piscinas')
assert.equal(stored.get('construyendo:categoria'), 'piscinas')
privacy.savePrivacy(false)
assert.equal(stored.size, 0, 'Revocar las preferencias borra la categoría.')
assert.equal(privacy.preferencesAllowed(), false)
privacy.rememberCategory('pisos')
assert.equal(stored.size, 0, 'El rechazo sigue vigente al cambiar la categoría.')
assert.deepEqual(events, [privacy.privacyChanged, privacy.privacyChanged])
console.log('Privacidad: consentimiento explícito, rechazo, revocación, vencimiento y cookie segura verificados.')
