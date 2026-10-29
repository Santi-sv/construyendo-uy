import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/lib/quotes.ts', import.meta.url), 'utf8')
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { quoteZones, buildQuoteMessage } = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`)

assert.deepEqual(quoteZones.filter((zone) => zone.free).map((zone) => zone.id), ['maldonado-ciudad', 'punta-del-este'])
for (const zone of quoteZones) {
  const message = buildQuoteMessage({ service: 'Baño', zoneId: zone.id, otherLocation: 'San Carlos', details: 'Paredes de 12 m²\nPorcelanato blanco.' })
  assert.ok(message.includes('Trabajo: Baño.'))
  assert.ok(message.includes(`Ubicación: ${zone.id === 'otra' ? 'San Carlos' : zone.label}.`))
  assert.ok(message.includes('Paredes de 12 m²\nPorcelanato blanco.'))
  assert.equal(message.includes('es sin cargo'), zone.free, `Política incorrecta para ${zone.label}`)
  assert.equal(message.includes('conocer el costo'), !zone.free)
  assert.equal(new URL(`https://wa.me/59898375863?text=${encodeURIComponent(message)}`).searchParams.get('text'), message)
}
assert.ok(!buildQuoteMessage({ service: 'Piso', zoneId: 'zona-desconocida' }).includes('es sin cargo'))
const emptyDraft = buildQuoteMessage({ service: '', zoneId: '' })
assert.ok(!emptyDraft.includes('['), 'El borrador no debe mostrar campos de plantilla.')
assert.ok(!emptyDraft.includes('Trabajo:') && !emptyDraft.includes('Ubicación:'))
assert.ok(!emptyDraft.includes('sin cargo') && !emptyDraft.includes('conocer el costo'), 'Sin zona elegida, el cierre debe ser neutral.')
const partialDraft = buildQuoteMessage({ service: 'Piso', zoneId: '' })
assert.ok(partialDraft.includes('Trabajo: Piso.') && !partialDraft.includes('Ubicación:'))
assert.ok(!buildQuoteMessage({ service: 'Piso', zoneId: 'otra', otherLocation: '  ' }).includes('Ubicación:'))
console.log('Presupuestos: gratuidad limitada a las dos ciudades, consulta de costo en otras zonas, detalles y codificación de WhatsApp verificados.')
