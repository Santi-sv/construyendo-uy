export const privacyCookie = 'cy_privacy'
export const privacyChanged = 'construyendo:privacy'
const lifetime = 180 * 24 * 60 * 60
export type PrivacyChoice = { version: 1; preferences: boolean; savedAt: number }

export function parsePrivacy(cookie: string, now = Date.now()): PrivacyChoice | null {
  try {
    const value = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${privacyCookie}=`))?.slice(privacyCookie.length + 1)
    if (!value) return null
    const choice = JSON.parse(decodeURIComponent(value))
    if (choice?.version !== 1 || typeof choice.preferences !== 'boolean' || !Number.isFinite(choice.savedAt) || choice.savedAt > now + 300_000 || now - choice.savedAt >= lifetime * 1000) return null
    return { version: 1, preferences: choice.preferences, savedAt: choice.savedAt }
  } catch { return null }
}
export const readPrivacy = () => parsePrivacy(document.cookie)
export const preferencesAllowed = () => readPrivacy()?.preferences === true
export function rememberCategory(category: string) {
  try {
    if (preferencesAllowed()) localStorage.setItem('construyendo:categoria', category)
    else localStorage.removeItem('construyendo:categoria')
  } catch { /* El visitante puede bloquear el almacenamiento. */ }
}
export function savePrivacy(preferences: boolean): PrivacyChoice {
  const choice: PrivacyChoice = { version: 1, preferences, savedAt: Date.now() }
  const localPreview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
  document.cookie = `${privacyCookie}=${encodeURIComponent(JSON.stringify(choice))}; Max-Age=${lifetime}; Path=/; SameSite=Lax${localPreview && location.protocol === 'http:' ? '' : '; Secure'}`
  if (!preferences) { try { localStorage.removeItem('construyendo:categoria') } catch { /* Almacenamiento bloqueado. */ } }
  window.dispatchEvent(new CustomEvent(privacyChanged, { detail: choice }))
  return choice
}
