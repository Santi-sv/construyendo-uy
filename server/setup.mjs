import fs from 'node:fs/promises'
import path from 'node:path'
import { hashCode, randomToken } from './auth.mjs'
import { localStore } from './local-store.mjs'
const directory = process.env.CMS_DATA_DIR || path.resolve('.cms-data')
const { STORE } = await localStore(directory)
if (await STORE.get('credential')) throw new Error('El acceso ya está configurado. Cambiá el código desde Configuración.')
async function secret(prompt) {
  if (!process.stdin.isTTY) throw new Error('Ejecutá este comando en una terminal interactiva.')
  process.stdout.write(prompt)
  process.stdin.setRawMode(true); process.stdin.resume(); process.stdin.setEncoding('utf8')
  return new Promise((resolve, reject) => {
    let value = ''
    const input = chunk => {
      for (const char of chunk) {
        if (char === '\u0003') { cleanup(); reject(new Error('Configuración cancelada.')); return }
        if (char === '\r' || char === '\n') { cleanup(); resolve(value); return }
        if (char === '\u007f') value = value.slice(0, -1)
        else if (char.charCodeAt(0) >= 32) value += char
      }
    }
    const cleanup = () => { process.stdin.off('data', input); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write('\n') }
    process.stdin.on('data', input)
  })
}
const localRandom = process.argv.includes('--random-local')
const code = localRandom ? randomToken().slice(0, 24) : await secret('Código inicial (mínimo 14 caracteres; no se mostrará): ')
if (!localRandom && code !== await secret('Repetí el código: ')) throw new Error('Los códigos no coinciden.')
await STORE.create('credential', JSON.stringify(await hashCode(code)))
if (localRandom) {
  const file = path.join(directory, 'acceso-local.txt')
  await fs.writeFile(file, `Código de acceso para la revisión local de ConstruYENDO:\n${code}\n\nEste código no habilita ningún acceso a la web pública.\n`, { mode: 0o600 })
  console.log(`Acceso local creado. Código disponible solo en el archivo privado: ${file}`)
} else console.log('Código configurado. El valor no se guardó en texto legible.')
