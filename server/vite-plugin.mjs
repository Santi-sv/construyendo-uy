import { Readable } from 'node:stream'
import fs from 'node:fs/promises'
import path from 'node:path'
import { handleApi } from './api.mjs'
import { localStore } from './local-store.mjs'
export default function cmsLocalPlugin() {
  return {
    name: 'construyendo-private-admin-local',
    apply: 'serve',
    async configureServer(server) {
      const storage = await localStore(process.env.CMS_DATA_DIR || path.join(server.config.root, '.cms-data'))
      const seed = JSON.parse(await fs.readFile(new URL('./seed.json', import.meta.url), 'utf8'))
      const origin = 'http://127.0.0.1:5173'
      const env = { ...storage, SEED: seed, DEV_MODE: true, ADMIN_ORIGIN: origin, PUBLIC_SITE_URL: `${origin}/` }
      server.middlewares.use(async (incoming, outgoing, next) => {
        if (!incoming.url?.startsWith('/api/') && !incoming.url?.startsWith('/media/')) return next()
        try {
          const request = new Request(new URL(incoming.url, origin), { method: incoming.method, headers: incoming.headers, ...(['GET', 'HEAD'].includes(incoming.method) ? {} : { body: Readable.toWeb(incoming), duplex: 'half' }) })
          const response = await handleApi(request, { ...env, CLIENT_IP: incoming.socket.remoteAddress })
          outgoing.writeHead(response.status, Object.fromEntries(response.headers))
          if (response.body) Readable.fromWeb(response.body).pipe(outgoing)
          else outgoing.end()
        } catch { outgoing.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); outgoing.end(JSON.stringify({ error: 'No pudimos completar la operación.' })) }
      })
    },
  }
}
