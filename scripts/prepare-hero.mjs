import sharp from 'sharp'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const input = process.argv[2]
if (!input) throw new Error('Indicá el archivo de la imagen ilustrativa de portada.')
const masterDirectory = resolve(root, 'assets/hero')
const publicDirectory = resolve(root, 'public/images/hero')
await mkdir(masterDirectory, { recursive: true })
await mkdir(publicDirectory, { recursive: true })
const master = resolve(masterDirectory, 'interior-trabajadores-v1.png')
if (resolve(input) !== master) await copyFile(input, master)
const buffer = await sharp(master).autoOrient().toBuffer()
const meta = await sharp(buffer).metadata()
const exports = { desktop: {}, mobile: {} }
for (const [label, width] of [['small', 1280], ['large', 2400]]) {
  const name = `interior-trabajadores-desktop-${label}.webp`
  const result = await sharp(buffer).resize({ width, withoutEnlargement: true }).webp({ quality: 90, effort: 6 }).toFile(resolve(publicDirectory, name))
  exports.desktop[label] = { src: `/images/hero/${name}`, width: result.width, height: result.height }
}
// El encuadre móvil conserva el lado de la escena en el que trabajan las dos personas.
const cropLeft = Math.floor(meta.width * .4)
const cropWidth = meta.width - cropLeft
const mobileSource = await sharp(buffer).extract({ left: cropLeft, top: 0, width: cropWidth, height: meta.height }).toBuffer()
for (const [label, width] of [['small', 640], ['large', 1280]]) {
  const name = `interior-trabajadores-mobile-${label}.webp`
  const result = await sharp(mobileSource).resize({ width, withoutEnlargement: true }).webp({ quality: 90, effort: 6 }).toFile(resolve(publicDirectory, name))
  exports.mobile[label] = { src: `/images/hero/${name}`, width: result.width, height: result.height }
}
await writeFile(resolve(root, 'src/data/hero-image.json'), JSON.stringify(exports, null, 2) + '\n')
await writeFile(resolve(masterDirectory, 'provenance.json'), JSON.stringify({
  purpose: 'Imagen ilustrativa de marca para la portada. No es una fotografía de una obra real.',
  method: 'Generada con la herramienta integrada image_gen por pedido explícito del usuario.',
  reference: 'assets/brand/construyendo-logo-reference.png',
  master: 'assets/hero/interior-trabajadores-v1.png',
  prompt: 'assets/hero/hero-interior.prompt.txt',
  originalProjectPhotosChanged: false,
  width: meta.width, height: meta.height,
}, null, 2) + '\n')
console.log(`Portada preparada: ${meta.width} × ${meta.height}, cuatro WebP y encuadre para celular.`)
