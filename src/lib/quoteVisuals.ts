import { managedLocation } from './managedContent'
import { imageUrl } from './gallery'
import { assetUrl } from './assets'
import locationPhotos from '../data/quote-locations.json'
import type { quoteServices } from './quotes'

export type QuotePhoto = {
  src: string
  position: string
  source?: string
  license?: string
  licenseUrl?: string
  caption?: string
  credit?: string
}

const servicePhotos = {
  'Baño': { id: 'bano-marmol-blanco', position: 'center 50%' },
  'Piso': { id: 'piso-gran-formato', position: 'center 75%' },
  'Piscina': { id: 'piscina-fondo', position: 'center 43%' },
  'Piedra librillo': { id: 'librillo-pared', position: 'center 50%' },
  'Escalera': { id: 'escalera-exterior', position: 'center 55%' },
  'Fachada': { id: 'librillo-fachada', position: 'center 50%' },
  'Otro revestimiento': { id: 'piso-nivelacion-vista', position: 'center 60%' },
} satisfies Record<typeof quoteServices[number], { id: string; position: string }>

export function servicePhoto(service: string): QuotePhoto | undefined {
  const photo = servicePhotos[service as keyof typeof servicePhotos]
  return photo ? { src: imageUrl(photo.id, 640), position: photo.position } : undefined
}

export function locationPhoto(zoneId: string): QuotePhoto | undefined {
  if (!Object.hasOwn(locationPhotos, zoneId)) return undefined
  const managed = managedLocation(zoneId)
  if (managed) return { src: managed.image.small, position: locationPhotos[zoneId as keyof typeof locationPhotos].position, caption: managed.caption || undefined, source: managed.source, license: managed.license, licenseUrl: managed.licenseUrl, credit: managed.mediaId ? 'ConstruYENDO' : undefined }
  const { file, ...photo } = locationPhotos[zoneId as keyof typeof locationPhotos]
  return { ...photo, src: assetUrl(`images/localidades/${file}`) }
}
