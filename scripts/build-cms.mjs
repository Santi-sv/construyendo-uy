import fs from 'node:fs/promises'
import path from 'node:path'
import { build } from 'vite'
import react from '@vitejs/plugin-react'
const root = process.cwd()
await build({ configFile: false, root, base: '/', plugins: [react()], build: { outDir: '.cms-build', emptyOutDir: true, target: 'es2022', rollupOptions: { input: path.join(root, 'admin.html') } } })
const assets = {}
const types = { '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2', '.html': 'text/html; charset=utf-8' }
async function collect(directory, prefix = '') {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}/${entry.name}`
    if (entry.isDirectory()) await collect(path.join(directory, entry.name), relative)
    else if (types[path.extname(entry.name)]) assets[relative] = { type: types[path.extname(entry.name)], bytes: (await fs.readFile(path.join(directory, entry.name))).toString('base64') }
  }
}
await collect(path.join(root, '.cms-build'))
await build({ configFile: false, root, plugins: [{ name: 'cms-admin-assets', resolveId: id => id === 'virtual:cms-assets' ? '\0cms-assets' : null, load: id => id === '\0cms-assets' ? `export default ${JSON.stringify(assets)}` : null }], build: { outDir: '.cms-dist/server', emptyOutDir: true, target: 'es2022', minify: true, lib: { entry: path.join(root, 'server/worker.mjs'), formats: ['es'], fileName: () => 'index.js' }, rollupOptions: { output: { inlineDynamicImports: true } } } })
console.log('Servicio ESM preparado en .cms-dist/server/index.js. No se ha publicado ni configurado un acceso de producción.')
