import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/contactLaunch.ts', import.meta.url), 'utf8')
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { launchContact } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`)
const destination = 'https://wa.me/59898375863?text=Consulta%20de%20prueba'

const navigations = []
const popup = { opener: 'parent', location: { replace: (url) => navigations.push(['popup', url]) }, close: () => navigations.push(['closed']) }
launchContact(destination, 'whatsapp', { open: () => popup, navigate: (url) => navigations.push(['same-tab', url]) })
assert.equal(popup.opener, null, 'La pestaña de WhatsApp no debe conservar acceso a su opener.')
assert.deepEqual(navigations, [['popup', destination]], 'La apertura permitida no debe duplicarse en la misma pestaña.')

for (const open of [() => null, () => { throw new Error('Popups unavailable') }]) {
  const fallback = []
  launchContact(destination, 'whatsapp', { open, navigate: (url) => fallback.push(url) })
  assert.deepEqual(fallback, [destination], 'Un popup bloqueado debe abrir el destino una sola vez en la pestaña actual.')
}

const failedPopup = []
launchContact(destination, 'whatsapp', {
  open: () => ({ opener: 'parent', location: { replace: () => { throw new Error('Navigation failed') } }, close: () => failedPopup.push('closed') }),
  navigate: (url) => failedPopup.push(url),
})
assert.deepEqual(failedPopup, ['closed', destination], 'Se debe cerrar una pestaña vacía fallida antes de usar el destino alternativo.')

const phoneActions = []
launchContact('tel:+59898375863', 'phone', { open: () => { throw new Error('La llamada no debe crear pestañas') }, navigate: (url) => phoneActions.push(url) })
assert.deepEqual(phoneActions, ['tel:+59898375863'])
console.log('Contacto: apertura única, pestaña sin opener, alternativa ante bloqueo y enlace tel: verificados con destinos simulados.')
