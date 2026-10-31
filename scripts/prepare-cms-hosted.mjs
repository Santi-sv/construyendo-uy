import fs from 'node:fs/promises'
import path from 'node:path'
const root = process.cwd()
const target = path.join(root, 'cms-hosted')
const hosting = JSON.parse(await fs.readFile(path.join(target, '.openai/hosting.json'), 'utf8'))
if (!hosting.project_id) throw new Error('Primero debe registrarse el servicio de administración.')
const directories = ['src/admin']
for (const dir of directories) await fs.cp(path.join(root, dir), path.join(target, dir), { recursive: true })
const files = ['admin.html', 'src/brand.css', 'src/components/Icons.tsx', 'src/lib/managedContent.ts', 'src/data/cms-hosting.json', 'server/api.mjs', 'server/auth.mjs', 'server/cloud-store.mjs', 'server/worker.mjs', 'server/seed.json']
for (const file of files) { await fs.mkdir(path.dirname(path.join(target, file)), { recursive: true }); await fs.copyFile(path.join(root, file), path.join(target, file)) }
await fs.mkdir(path.join(target, 'scripts'), { recursive: true })
const build = (await fs.readFile(path.join(root, 'scripts/build-cms.mjs'), 'utf8')).replaceAll('.cms-dist/server', 'dist/server')
await fs.writeFile(path.join(target, 'scripts/build-cms.mjs'), build)
const lock = JSON.parse(await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'))
const exact = name => lock.packages[`node_modules/${name}`].version
const production = ['react', 'react-dom', '@fontsource-variable/manrope', '@fontsource/barlow-condensed', '@noble/hashes']
const development = ['vite', '@vitejs/plugin-react', 'typescript', '@types/node', '@types/react', '@types/react-dom']
const manifest = { name: 'construyendo-private-admin', version: '1.0.0', private: true, type: 'module', scripts: { build: 'node scripts/build-cms.mjs', 'db:generate': 'drizzle-kit generate' }, dependencies: Object.fromEntries(production.map(name => [name, exact(name)])), devDependencies: { ...Object.fromEntries(development.map(name => [name, exact(name)])), 'drizzle-kit': '0.31.11', 'drizzle-orm': '0.45.4' } }
await fs.writeFile(path.join(target, 'package.json'), JSON.stringify(manifest, null, 2) + '\n')
await fs.writeFile(path.join(target, '.gitignore'), 'node_modules/\ndist/\n.cms-build/\n.env*\n!.env.example\n.dev.vars*\n*.tsbuildinfo\n.DS_Store\noutputs/\n.sites-runtime/\n')
console.log('Fuente de administración sincronizada. No se copiaron credenciales, sesiones, cargas locales ni JPG originales.')
