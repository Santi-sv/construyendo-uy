import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cmsLocalPlugin from './server/vite-plugin.mjs'

export default defineConfig({
  plugins: [react(), tailwindcss(), cmsLocalPlugin()],
  server: { port: 5173, strictPort: true, fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.cms-data/**', '**/.cms-build/**', '**/.cms-dist/**'] } },
  build: { target: 'es2022' },
})
