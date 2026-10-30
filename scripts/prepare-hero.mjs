import sharp from 'sharp'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const input = process.argv[2]
if (!input) throw new Error('Indicá el archivo de la imagen ilustrativa de portada.')
const masterDirectory = resolve(root, 'assets/hero')
const publicDirectory = resolve(root, 'public/images/hero')
await mkdir(masterDirectory, { recursive: true })
await mkdir(publicDirectory, { recursive: true })
const stem = process.argv[3] || basename(input, extname(input))
if (!/^[a-z0-9-]+$/.test(stem)) throw new Error('Usá un nombre de portada en minúsculas, con números y guiones.')
const master = resolve(masterDirectory, `${stem}${extname(input).toLowerCase()}`)
if (resolve(input) !== master) await copyFile(input, master)
const buffer = await sharp(master).autoOrient().toBuffer()
const meta = await sharp(buffer).metadata()
const exports = { desktop: {}, mobile: {} }
for (const [label, width] of [['small', 1280], ['large', 2400]]) {
  const name = `${stem}-desktop-${label}.webp`
  const result = await sharp(buffer).resize({ width, withoutEnlargement: true }).webp({ quality: 90, effort: 6 }).toFile(resolve(publicDirectory, name))
  exports.desktop[label] = { src: `/images/hero/${name}`, width: result.width, height: result.height }
}
// Encuadre central 16:10: conserva a los dos instaladores sin ampliar la imagen.
const cropWidth = Math.min(meta.width, Math.round(meta.height * 1.6))
const cropHeight = Math.min(meta.height, Math.round(meta.width / 1.6))
const mobileSource = await sharp(buffer).extract({ left: Math.floor((meta.width - cropWidth) / 2), top: Math.floor((meta.height - cropHeight) / 2), width: cropWidth, height: cropHeight }).toBuffer()
for (const [label, width] of [['small', 640], ['large', 1280]]) {
  const name = `${stem}-mobile-${label}.webp`
  const result = await sharp(mobileSource).resize({ width, withoutEnlargement: true }).webp({ quality: 90, effort: 6 }).toFile(resolve(publicDirectory, name))
  exports.mobile[label] = { src: `/images/hero/${name}`, width: result.width, height: result.height }
}
await writeFile(resolve(root, 'src/data/hero-image.json'), JSON.stringify(exports, null, 2) + '\n')
await writeFile(resolve(masterDirectory, 'provenance.json'), JSON.stringify({
  purpose: 'Imagen ilustrativa de marca para la portada. No es una fotografía de una obra real.',
  method: 'Imagen ilustrativa proporcionada por el usuario para reemplazar la portada.',
  master: `assets/hero/${basename(master)}`,
  originalProjectPhotosChanged: false,
  width: meta.width, height: meta.height,
}, null, 2) + '\n')
console.log(`Portada preparada: ${meta.width} × ${meta.height}, cuatro WebP y encuadre para celular.`)
