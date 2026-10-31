export function cloudStore(env) {
  return {
    STORE: {
      async purgeExpired() { await env.DB.prepare('DELETE FROM cms_records WHERE key IN (SELECT key FROM cms_records WHERE expires_at IS NOT NULL AND expires_at <= ? LIMIT 100)').bind(Date.now()).run() },
      async get(key) { const row = await env.DB.prepare('SELECT value FROM cms_records WHERE key = ? AND (expires_at IS NULL OR expires_at > ?)').bind(key, Date.now()).first(); return row?.value ?? null },
      async create(key, value, expires = null) {
        // Una clave vencida se puede reutilizar; ambas escrituras son atómicas.
        await env.DB.prepare('DELETE FROM cms_records WHERE key = ? AND expires_at IS NOT NULL AND expires_at <= ?').bind(key, Date.now()).run()
        const result = await env.DB.prepare('INSERT OR IGNORE INTO cms_records (key, value, expires_at) VALUES (?, ?, ?)').bind(key, value, expires).run()
        return result.meta.changes === 1
      },
      async cas(key, old, value, expires = null) { const result = await env.DB.prepare('UPDATE cms_records SET value = ?, expires_at = ? WHERE key = ? AND value = ? AND (expires_at IS NULL OR expires_at > ?)').bind(value, expires, key, old, Date.now()).run(); return result.meta.changes === 1 },
      async delete(key) { const result = await env.DB.prepare('DELETE FROM cms_records WHERE key = ?').bind(key).run(); return result.meta.changes === 1 },
    },
    FILES: {
      async put(key, bytes) { await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg' } }) },
      async get(key) { const file = await env.BUCKET.get(key); return file?.body ?? null },
    },
  }
}
