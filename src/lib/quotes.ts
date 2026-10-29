export const quoteZones = [
  { id: 'maldonado-ciudad', label: 'Ciudad de Maldonado', free: true },
  { id: 'punta-del-este', label: 'Punta del Este', free: true },
  { id: 'punta-ballena', label: 'Punta Ballena', free: false },
  { id: 'pan-de-azucar', label: 'Pan de Azúcar', free: false },
  { id: 'piriapolis', label: 'Piriápolis', free: false },
  { id: 'jose-ignacio', label: 'José Ignacio', free: false },
  { id: 'la-capuera', label: 'La Capuera', free: false },
  { id: 'otra', label: 'Otra zona', free: false },
] as const

export const quoteServices = ['Baño', 'Piso', 'Piscina', 'Piedra librillo', 'Escalera', 'Fachada', 'Otro revestimiento'] as const
export const freeVisitPolicy = 'Sin cargo en la ciudad de Maldonado y Punta del Este. Otras zonas: costo según ubicación.'

export function buildQuoteMessage({ service, zoneId, otherLocation = '', details = '' }: { service: string; zoneId: string; otherLocation?: string; details?: string }) {
  const zone = quoteZones.find((item) => item.id === zoneId)
  const location = zoneId === 'otra' ? otherLocation.trim() : zone?.label
  const parts = [
    'Hola, vi la web de ConstruYENDO y quisiera solicitar un presupuesto.',
  ]
  if (service || location || details.trim()) parts.push('')
  if (service) parts.push(`Trabajo: ${service}.`)
  if (location) parts.push(`Ubicación: ${location}.`)
  if (details.trim()) parts.push(`Detalles: ${details.trim()}`)
  parts.push('', !zoneId ? 'Me gustaría coordinar una visita para conversar sobre mi proyecto.' : zone?.free
    ? 'Entiendo que la visita para presupuestar en esta zona es sin cargo. ¿Podemos coordinarla?'
    : 'Quisiera conocer el costo de la visita para presupuestar en esta zona y coordinarla.')
  return parts.join('\n')
}
