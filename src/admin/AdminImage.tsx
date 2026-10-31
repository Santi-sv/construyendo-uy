import { useEffect, useState } from 'react'
import type { ImgHTMLAttributes } from 'react'
import { adminImage, privateMediaUrl } from './api'

export function AdminImage({ src = '', alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const privateUrl = privateMediaUrl(src)
  const [preview, setPreview] = useState<{ src: string; blob: string } | null>(null)
  const [failed, setFailed] = useState('')
  useEffect(() => {
    if (!privateUrl) return
    const controller = new AbortController()
    let objectUrl = ''
    adminImage(privateUrl, controller.signal).then(blob => {
      if (controller.signal.aborted) return
      objectUrl = URL.createObjectURL(blob)
      setPreview({ src, blob: objectUrl })
    }).catch(() => { if (!controller.signal.aborted) setFailed(src) })
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [src, privateUrl])
  const display = privateUrl ? preview?.src === src ? preview.blob : undefined : src
  return <img {...props} src={display} alt={failed === src ? `No se pudo cargar: ${alt || 'imagen'}` : alt} />
}
