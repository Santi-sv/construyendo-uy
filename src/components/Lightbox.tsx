import { useEffect, useRef } from 'react'
import type { Project } from '../lib/gallery'
import { categories, imageDimensions, imageUrl, projectMessage, whatsappUrl } from '../lib/gallery'
import { Icon } from './Icons'

interface LightboxProps {
  photos: Project[]
  index: number
  onIndexChange: (index: number) => void
  onClose: () => void
}

export function Lightbox({ photos, index, onIndexChange, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const project = photos[index]
  const next = (offset: number) => onIndexChange((index + offset + photos.length) % photos.length)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog?.showModal()
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      previousFocus?.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    const img = new Image()
    img.src = imageUrl(photos[(index + 1) % photos.length].id, 1400)
  }, [index, photos])

  return (
    <dialog ref={dialogRef} className="lightbox" aria-label="Visor de trabajos" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === event.currentTarget) onClose() }} onKeyDown={(event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); next(-1) }
      if (event.key === 'ArrowRight') { event.preventDefault(); next(1) }
    }}>
      <div className="lightbox-bar">
        <span className="lightbox-brand">CONSTRU<span>YENDO</span><span className="lightbox-bar-label"> / NUESTROS TRABAJOS</span></span>
        <span className="lightbox-counter" aria-live="polite" aria-atomic="true">{index + 1} <span>/ {photos.length}</span></span>
        <button className="icon-button lightbox-close" aria-label="Cerrar visor" onClick={onClose} autoFocus><Icon name="close" size={25} /></button>
      </div>
      <div className="lightbox-stage" onTouchStart={(event) => { const point = event.changedTouches[0]; touch.current = { x: point.clientX, y: point.clientY } }} onTouchEnd={(event) => {
        if (!touch.current) return
        const point = event.changedTouches[0]
        const deltaX = point.clientX - touch.current.x
        const deltaY = point.clientY - touch.current.y
        if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) next(deltaX < 0 ? 1 : -1)
        touch.current = null
      }}>
        <button className="icon-button lightbox-previous" aria-label="Trabajo anterior" onClick={() => next(-1)}><Icon name="chevron-left" size={28} /></button>
        <img key={project.id} src={imageUrl(project.id, 1400)} {...imageDimensions(project.id)} alt={project.description} className="lightbox-photo" />
        <button className="icon-button lightbox-next" aria-label="Trabajo siguiente" onClick={() => next(1)}><Icon name="chevron-right" size={28} /></button>
      </div>
      <div className="lightbox-bottom">
        <div><span className="eyebrow lightbox-category">{categories.find((category) => category.id === project.category)?.label}</span><p id="lightbox-description">{project.description}</p><span className="lightbox-hint">Deslizá o usá las flechas para ver más</span></div>
        <a className="button button--light" href={whatsappUrl(projectMessage(project))} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" />Quiero algo así<Icon name="arrow" size={18} /></a>
      </div>
    </dialog>
  )
}
