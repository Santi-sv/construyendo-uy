import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cmsLocalPlugin from './server/vite-plugin.mjs'
import { resolve } from 'node:path'
import hostedConfiguration from './src/data/cms-hosting.json'

export default defineConfig({
  plugins: [react(), tailwindcss(), cmsLocalPlugin(), {
    name: 'site-security-policy', apply: 'build',
    transformIndexHtml(html, context) {
      if (!['/admin.html', '/index.html'].some(file => context.filename.endsWith(file))) return html
      const origin = new URL(process.env.VITE_CMS_ORIGIN || hostedConfiguration.origin).origin
      return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' ${origin} https://santi-sv.github.io blob: data:; font-src 'self'; connect-src 'self' ${origin}; base-uri 'none'; object-src 'none'; form-action 'self'` }, injectTo: 'head-prepend' }]
    },
  }],
  server: { port: 5173, strictPort: true, fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.cms-data/**', '**/.cms-build/**', '**/.cms-dist/**', '**/cms-hosted/**', '**/.sites-runtime/**', '**/.openai/**', '**/.codex/**', '**/.agents/**', '**/.aws/**', '**/.qa/**'] } },
  build: { target: 'es2022', rollupOptions: { input: { main: resolve('index.html'), admin: resolve('admin.html') } } },
})
