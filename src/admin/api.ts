export class AdminError extends Error {
  constructor(message: string, public status: number) { super(message) }
}
export async function adminRequest<T>(path: string, csrf?: string, body?: unknown, method = body === undefined ? 'GET' : 'POST'): Promise<T> {
  const form = body instanceof FormData
  let response: Response
  try {
    response = await fetch(`/api/admin/${path}`, { method, credentials: 'same-origin', cache: 'no-store', headers: { ...(body === undefined || form ? {} : { 'Content-Type': 'application/json' }), ...(csrf ? { 'X-CSRF-Token': csrf } : {}) }, body: body === undefined ? undefined : form ? body : JSON.stringify(body) })
  } catch { throw new AdminError('No pudimos conectar con el administrador. Revisá la conexión e intentá nuevamente.', 0) }
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new AdminError(result.error || 'No pudimos completar la operación.', response.status)
  return result as T
}
export async function prepareUpload(file: File): Promise<FormData> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Elegí una imagen JPG, PNG o WebP.')
  if (file.size > 25_000_000) throw new Error('La imagen no puede superar los 25 MB.')
  let bitmap: ImageBitmap
  try { bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }) } catch { throw new Error('No pudimos abrir esta imagen. Probá con otro archivo JPG o PNG.') }
  try {
    if (bitmap.width < 32 || bitmap.height < 32 || bitmap.width * bitmap.height > 80_000_000) throw new Error('Elegí una foto de entre 32 píxeles y 80 megapíxeles.')
    const version = async (side: number) => {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
      const context = canvas.getContext('2d')
      if (!context) throw new Error('El navegador no pudo procesar la imagen.')
      context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('No pudimos preparar la imagen.')), 'image/jpeg', .86))
    }
    const [small, large] = await Promise.all([version(640), version(2000)])
    const form = new FormData(); form.append('small', small, 'small.jpg'); form.append('large', large, 'large.jpg')
    return form
  } finally { bitmap.close() }
}
