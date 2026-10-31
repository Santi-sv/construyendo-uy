import fs from 'node:fs/promises'
const projects = JSON.parse(await fs.readFile('src/data/projects.json', 'utf8'))
const process = JSON.parse(await fs.readFile('src/data/process.json', 'utf8'))
const dimensions = JSON.parse(await fs.readFile('src/data/dimensions.json', 'utf8'))
const locationImages = JSON.parse(await fs.readFile('src/data/quote-locations.json', 'utf8'))
const labels = { 'maldonado-ciudad': 'Ciudad de Maldonado', 'punta-del-este': 'Punta del Este', 'punta-ballena': 'Punta Ballena', 'pan-de-azucar': 'Pan de Azúcar', piriapolis: 'Piriápolis', 'jose-ignacio': 'José Ignacio', 'la-capuera': 'La Capuera' }
const locations = Object.entries(locationImages).map(([id, image]) => ({ id, label: labels[id], ...image, mediaId: null, caption: image.caption || '' }))
const hero = JSON.parse(await fs.readFile('src/data/hero-image.json', 'utf8'))
const photos = [...projects.map(p => ({ ...p, visible: !p.detailOf, mediaId: null })), ...process.filter(p => !projects.some(q => q.id === p.id)).map((p, i) => ({ ...p, category: i === 1 ? 'banos' : i === 2 ? 'escaleras' : 'pisos', visible: false, auxiliary: true, mediaId: null }))]
const seed = { schemaVersion: 1, photos, locations, hero: { mediaId: null, kind: 'illustrative', alt: 'Imagen ilustrativa: dos instaladores de espalda colocando baldosas de gran formato con niveladores en el interior de una vivienda moderna.' }, dimensions, heroImage: hero }
await fs.writeFile('server/seed.json', JSON.stringify(seed, null, 2) + '\n')
console.log(`${photos.length} fotografías preparadas para el administrador.`)
