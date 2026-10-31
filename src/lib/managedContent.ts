import hostedConfiguration from '../data/cms-hosting.json'
export type PhotoCategory = 'banos' | 'pisos' | 'piscinas' | 'piedra' | 'escaleras'
export type ManagedImage = { small: string; large: string; width: number; height: number; smallWidth?: number; smallHeight?: number }
export type HeroImages = Record<'desktop' | 'mobile', Record<'small' | 'large', { src: string; width: number; height: number }>>
export type ManagedPhoto = { id: string; category: PhotoCategory; description: string; visible: boolean; mediaId: string | null; auxiliary?: boolean; prefix?: string; detailOf?: string; detailIds?: string[]; image: ManagedImage }
export type ManagedHero = { mediaId: string | null; kind: 'real' | 'illustrative'; alt: string; image: HeroImages }
export type ManagedLocation = { id: string; label: string; caption: string; mediaId: string | null; image: ManagedImage; source?: string; license?: string; licenseUrl?: string }
export type ManagedContent = { schemaVersion: 1; photos: ManagedPhoto[]; locations: ManagedLocation[]; hero: ManagedHero; revision: number; publishedAt: string | null }
export type AdminContent = ManagedContent & { publishedRevision: number; hasUnpublishedChanges: boolean }
export const cmsOrigin = (import.meta.env.VITE_CMS_ORIGIN || (import.meta.env.DEV ? '' : hostedConfiguration.origin)).replace(/\/$/, '')
export const adminUrl = cmsOrigin ? `${cmsOrigin}/admin` : import.meta.env.DEV ? '/admin.html' : ''
let active: ManagedContent | null = null
export function managedLocation(id: string) { return active?.locations.find(place => place.id === id) }
export function managedHero() { return active?.hero }
function safeUrl(value: unknown) {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return [location.origin, cmsOrigin, 'https://santi-sv.github.io'].includes(url.origin) && (url.protocol === 'https:' || (import.meta.env.DEV && url.protocol === 'http:'))
  } catch { return false }
}
export async function loadManagedContent(): Promise<ManagedContent | null> {
  if (!cmsOrigin && !import.meta.env.DEV) return null
  try {
    const response = await fetch(`${cmsOrigin}/api/public/content`, { signal: AbortSignal.timeout(1800), cache: 'no-store', credentials: 'omit' })
    if (!response.ok) return null
    const value = await response.json() as ManagedContent
    const categories = ['banos', 'pisos', 'piscinas', 'piedra', 'escaleras']
    if (value.schemaVersion !== 1 || !Array.isArray(value.photos) || !value.photos.length || value.photos.length > 200) return null
    if (value.photos.some(photo => !/^[a-z0-9-]{1,90}$/.test(photo.id) || !categories.includes(photo.category) || typeof photo.description !== 'string' || photo.description.length > 180 || typeof photo.visible !== 'boolean' || !safeUrl(photo.image?.small) || !safeUrl(photo.image?.large) || !(photo.image.width >= 32 && photo.image.width <= 12000 && photo.image.height >= 32 && photo.image.height <= 12000))) return null
    if (!value.photos.some(photo => photo.visible && !photo.detailOf && !photo.auxiliary)) return null
    if (!value.hero || typeof value.hero.alt !== 'string' || value.hero.alt.length > 240 || !['real', 'illustrative'].includes(value.hero.kind)) return null
    if (['desktop', 'mobile'].some(device => ['small', 'large'].some(size => !safeUrl(value.hero.image?.[device as 'desktop' | 'mobile']?.[size as 'small' | 'large']?.src)))) return null
    if (!Array.isArray(value.locations) || value.locations.length !== 7 || value.locations.some(place => !safeUrl(place.image?.small) || !safeUrl(place.image?.large) || typeof place.caption !== 'string' || place.caption.length > 80)) return null
    active = value
    return value
  } catch { return null }
}
