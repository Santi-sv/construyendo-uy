import fs from 'node:fs/promises'
import path from 'node:path'

export async function localStore(directory) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 })
  const file = path.join(directory, 'private-state.json')
  const lockPath = path.join(directory, 'private-state.lock')
  const read = async () => {
    try { return JSON.parse(await fs.readFile(file, 'utf8')) } catch (error) { if (error.code === 'ENOENT') return {}; throw error }
  }
  const present = record => record && (!record.expires || record.expires > Date.now())
  let queue = Promise.resolve()
  async function lock() {
    const deadline = Date.now() + 8000
    while (Date.now() < deadline) {
      try {
        const handle = await fs.open(lockPath, 'wx', 0o600)
        await handle.writeFile(String(process.pid))
        return handle
      } catch (error) {
        if (error.code !== 'EEXIST') throw error
        try {
          const stat = await fs.stat(lockPath)
          if (Date.now() - stat.mtimeMs > 60_000) {
            const pid = Number(await fs.readFile(lockPath, 'utf8'))
            if (Number.isInteger(pid) && pid > 0) {
              try { process.kill(pid, 0) } catch (probe) { if (probe.code === 'ESRCH') await fs.unlink(lockPath) }
            }
          }
        } catch (probe) { if (probe.code !== 'ENOENT') throw probe }
        await new Promise(resolve => setTimeout(resolve, 25))
      }
    }
    throw new Error('El almacenamiento local está ocupado.')
  }
  const mutate = operation => {
    const result = queue.then(async () => {
      const handle = await lock()
      try {
        const records = await read()
        const changed = operation(records)
        if (changed) {
          for (const [key, record] of Object.entries(records)) if (!present(record)) delete records[key]
          const temporary = `${file}.next`
          const output = await fs.open(temporary, 'w', 0o600)
          try { await output.writeFile(JSON.stringify(records)); await output.sync() } finally { await output.close() }
          await fs.rename(temporary, file)
        }
        return changed
      } finally { await handle.close(); await fs.unlink(lockPath) }
    })
    queue = result.catch(() => {})
    return result
  }
  return {
    STORE: {
      async get(key) { await queue; const records = await read(); return present(records[key]) ? records[key].value : null },
      create(key, value, expires = null) { return mutate(records => { if (present(records[key])) return false; records[key] = { value, expires }; return true }) },
      cas(key, old, value, expires = null) { return mutate(records => { if (!present(records[key]) || records[key].value !== old) return false; records[key] = { value, expires }; return true }) },
      delete(key) { return mutate(records => { const existed = key in records; delete records[key]; return existed }) },
    },
    FILES: {
      async put(key, bytes) {
        if (!/^[a-f0-9-]+\/(small|large)\.jpg$/.test(key)) throw new Error('Archivo inválido')
        const target = path.join(directory, 'media', key)
        await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 })
        await fs.writeFile(target, new Uint8Array(bytes), { mode: 0o600 })
      },
      async get(key) {
        if (!/^[a-f0-9-]+\/(small|large)\.jpg$/.test(key)) return null
        try { return await fs.readFile(path.join(directory, 'media', key)) } catch (error) { if (error.code === 'ENOENT') return null; throw error }
      },
    },
  }
}
