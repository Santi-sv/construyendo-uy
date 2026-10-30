import sharp from 'sharp'
import { readdir, readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const readData = async (name) => JSON.parse(await readFile(resolve(root, `src/data/${name}.json`), 'utf8'))
const records = [...await readData('projects'), ...await readData('process')]
const folders = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory() && entry.name.startsWith('Seccion'))
const originals = (await Promise.all(folders.map(async ({ name }) => (await readdir(resolve(root, name))).map((file) => resolve(root, name, file))))).flat()
await mkdir(resolve(root, 'public/images/retocadas'), { recursive: true })
async function sourceFor(record) {
  const developed = resolve(root, `assets/fotos-reveladas/${record.id}.jpg`)
  try { await access(developed); return developed } catch (error) { if (error.code !== 'ENOENT') throw error }
  const original = originals.find((path) => path.split('/').at(-1).startsWith(record.prefix))
  if (!original) throw new Error(`No se encontró el original de ${record.id} (${record.prefix})`)
  return original
}
if (!process.argv.includes('--social-only')) {
  const dimensions = {}
  for (const record of records) {
    const source = await sourceFor(record)
    for (const size of [640, 1400]) {
      const suffix = size === 640 ? '640' : 'grande'
      const { width, height } = await sharp(source).autoOrient().resize({ width: size === 640 ? 640 : 2000, withoutEnlargement: true }).webp({ quality: size === 640 ? 84 : 91, effort: 6 }).toFile(resolve(root, `public/images/retocadas/${record.id}-${suffix}.webp`))
      if (size === 1400) dimensions[record.id] = { width, height }
    }
    console.log(`✓ ${record.id}`)
  }
  await writeFile(resolve(root, 'src/data/dimensions.json'), JSON.stringify(dimensions, null, 2) + '\n')
  console.log('✓ Dimensiones generadas.')
}

const heroSource = await sourceFor(records.find((record) => record.id === 'piso-marmol-negro'))
const hero = await sharp(heroSource).autoOrient().resize(600, 630, { fit: 'cover', position: 'bottom' }).toBuffer()
const socialText = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="630" fill="#0c0c0c"/><g font-family="Arial,sans-serif" fill="#f5f5f5"><text x="56" y="95" font-size="30" font-style="italic" font-weight="700">Constru<tspan fill="#dfbc94">Yendo</tspan></text><text x="56" y="127" font-size="13" letter-spacing="5">REVESTIMIENTOS</text><text x="56" y="245" font-size="44" font-weight="700">Revestimientos</text><text x="56" y="302" font-size="44" font-weight="700">a tu medida.</text><text x="56" y="375" font-size="20" fill="#edccaa">Diseño · Calidad · Durabilidad</text><text x="56" y="525" font-size="18">Maldonado, Uruguay</text><text x="56" y="560" font-size="18">construyendo.uy</text></g></svg>`)
await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#0c0c0c' } }).composite([{ input: hero, left: 600, top: 0 }, { input: socialText }]).jpeg({ quality: 87 }).toFile(resolve(root, 'public/images/portada-social.jpg'))
await sharp(resolve(root, 'public/favicon.svg')).resize(180, 180).png().toFile(resolve(root, 'public/apple-touch-icon.png'))
console.log('✓ Imagen social e ícono generados.')
