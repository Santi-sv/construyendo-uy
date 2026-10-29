import projectData from '../data/projects.json'
import dimensionData from '../data/dimensions.json'
import { assetUrl } from './assets'

export const categories = [
  { id: 'todos', label: 'Todos' },
  { id: 'banos', label: 'Baños' },
  { id: 'pisos', label: 'Pisos' },
  { id: 'piscinas', label: 'Piscinas' },
  { id: 'piedra', label: 'Piedra librillo' },
  { id: 'escaleras', label: 'Escaleras' },
] as const

export type Category = typeof categories[number]['id']
export type Project = Omit<typeof projectData[number], 'category'> & { category: Exclude<Category, 'todos'> }
const allPhotos = projectData as Project[]
export const projects = allPhotos.filter((photo) => !photo.detailOf)
export function withPhotoDetails(photos: Project[]) {
  return photos.flatMap((photo) => [photo, ...(photo.detailIds ?? []).flatMap((id) => {
    const detail = allPhotos.find((item) => item.id === id && item.detailOf === photo.id)
    return detail ? [detail] : []
  })])
}
export const dimensions: Record<string, { width: number; height: number }> = dimensionData
export const imageUrl = (id: string, size: 640 | 1400) => assetUrl(`images/retocadas/${id}-${size === 640 ? '640' : 'grande'}.webp`)
export const imageDimensions = (id: string) => dimensions[id] ?? { width: 1050, height: 1400 }
export const imageSources = (id: string) => `${imageUrl(id, 640)} ${Math.min(640, imageDimensions(id).width)}w, ${imageUrl(id, 1400)} ${imageDimensions(id).width}w`
const contactNumber = '59898375863'
export const phoneUrl = `tel:+${contactNumber}`
export const whatsappUrl = (message: string) => `https://wa.me/${contactNumber}?text=${encodeURIComponent(message)}`
export const visitMessage = 'Hola, vi la web de ConstruYENDO y quisiera solicitar un presupuesto de revestimiento. ¿Podemos coordinar una visita y consultar su costo según la ubicación de mi obra?'
export const contactMessage = 'Hola, vi la web de ConstruYENDO y quiero consultar por un trabajo de revestimiento.'
const spaces: Record<Project['category'], string> = { banos: 'un baño', pisos: 'un piso', piscinas: 'una piscina', piedra: 'un revestimiento en piedra', escaleras: 'una escalera' }
export const projectMessage = (project: Project) => `Hola, vi en la web el trabajo "${project.description}" y quiero algo así para ${spaces[project.category]}.`

export function savedCategory(): Category {
  try {
    const stored = localStorage.getItem('construyendo:categoria')
    return categories.find((category) => category.id === stored)?.id ?? 'todos'
  } catch { return 'todos' }
}
