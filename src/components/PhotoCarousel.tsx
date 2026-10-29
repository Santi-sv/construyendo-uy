import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { categories, imageDimensions, imageSources, imageUrl } from '../lib/gallery'
import type { Project } from '../lib/gallery'
import { useReducedMotion } from '../hooks/useMotion'
import { Icon } from './Icons'

type CarouselVariant = 'hero' | 'showcase' | 'editorial' | 'process' | 'strip' | 'mini'
interface PhotoCarouselProps {
  photos: Project[]
  label: string
  variant?: CarouselVariant
  priority?: boolean
  scrollAdvance?: boolean
  onOpen: (photos: Project[], index: number) => void
}

export function PhotoCarousel({ photos, label, variant = 'editorial', priority = false, scrollAdvance = false, onOpen }: PhotoCarouselProps) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const currentIndex = useRef(0)
  currentIndex.current = active
  const [visible, setVisible] = useState(false)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [pageVisible, setPageVisible] = useState(!document.hidden)
  const [imageErrors, setImageErrors] = useState<Set<string>>(() => new Set())
  const reduced = useReducedMotion()
  const drag = useRef<{ x: number; y: number; left: number; mouse: boolean } | null>(null)
  const suppressClick = useRef(false)
  const target = useRef<number | null>(null)
  const settle = useRef<number | undefined>(undefined)
  const interval = variant === 'hero' ? 6200 : 5200
  const playing = photos.length > 1 && !paused && !hovered && !focused && visible && pageVisible && !reduced
  const current = photos[active] ?? photos[0]

  const go = useCallback((index: number, manual = true) => {
    const element = track.current
    if (!element || !photos.length) return
    const next = (index + photos.length) % photos.length
    const children = element.querySelectorAll<HTMLElement>('.carousel-slide')
    const slide = children[next]
    if (!slide) return
    if (manual) setPaused(true)
    target.current = next
    setActive(next)
    window.clearTimeout(settle.current)
    const left = Math.min(slide.offsetLeft - children[0].offsetLeft, element.scrollWidth - element.clientWidth)
    const distant = Math.abs(left - element.scrollLeft) > element.clientWidth * 1.6
    element.scrollTo({ left, behavior: reduced || distant ? 'instant' : 'smooth' })
    settle.current = window.setTimeout(() => { target.current = null }, 850)
  }, [photos.length, reduced])

  useEffect(() => {
    setActive(0)
    setPaused(false)
    target.current = null
    if (track.current) track.current.scrollTo({ left: 0, behavior: 'instant' })
  }, [photos])

  useEffect(() => {
    const element = root.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= .22), { threshold: [0, .22] })
    observer.observe(element)
    const visibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])

  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => {
      if (!document.querySelector('dialog[open]')) go(active + 1, false)
    }, interval)
    return () => window.clearTimeout(timer)
  }, [playing, active, interval, go])

  useEffect(() => {
    const element = track.current
    if (!element) return
    let frame = 0
    const sync = () => {
      frame = 0
      const slides = [...element.querySelectorAll<HTMLElement>('.carousel-slide')]
      if (!slides.length) return
      const offset = slides[0].offsetLeft
      const maxScroll = element.scrollWidth - element.clientWidth
      if (target.current !== null) {
        if (Math.abs(element.scrollLeft - Math.min(slides[target.current]?.offsetLeft - offset, maxScroll)) < 3) target.current = null
        else return
      }
      if (maxScroll > 0 && element.scrollLeft >= maxScroll - 3) { setActive(slides.length - 1); return }
      let closest = 0
      let distance = Infinity
      slides.forEach((slide, index) => {
        const delta = Math.abs(slide.offsetLeft - offset - element.scrollLeft)
        if (delta < distance) { distance = delta; closest = index }
      })
      setActive(closest)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync) }
    element.addEventListener('scroll', schedule, { passive: true })
    let previousWidth = element.clientWidth
    const resize = new ResizeObserver(() => {
      if (previousWidth === element.clientWidth) return
      previousWidth = element.clientWidth
      const slides = element.querySelectorAll<HTMLElement>('.carousel-slide')
      const index = currentIndex.current
      if (slides[index]) element.scrollTo({ left: slides[index].offsetLeft - slides[0].offsetLeft, behavior: 'instant' })
    })
    resize.observe(element)
    return () => { element.removeEventListener('scroll', schedule); resize.disconnect(); cancelAnimationFrame(frame) }
  }, [photos])

  useEffect(() => {
    if (!scrollAdvance || reduced || paused || !visible || focused) return
    let frame = 0
    let lastIndex = -1
    const update = () => {
      frame = 0
      if (document.querySelector('dialog[open]')) return
      const section = root.current?.closest('section')
      if (!section) return
      const box = section.getBoundingClientRect()
      const progress = Math.max(0, Math.min(.999, (window.innerHeight * .8 - box.top) / (window.innerHeight * .8 + box.height * .55)))
      const index = Math.floor(progress * photos.length)
      if (index !== lastIndex) { lastIndex = index; go(index, false) }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', schedule, { passive: true })
    return () => { window.removeEventListener('scroll', schedule); cancelAnimationFrame(frame) }
  }, [scrollAdvance, reduced, paused, visible, focused, go, photos.length])

  useEffect(() => () => window.clearTimeout(settle.current), [])

  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    target.current = null
    suppressClick.current = false
    if (event.button === 0 && track.current) drag.current = { x: event.clientX, y: event.clientY, left: track.current.scrollLeft, mouse: event.pointerType === 'mouse' }
  }
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !track.current) return
    const difference = event.clientX - drag.current.x
    if (!drag.current.mouse) {
      if (Math.abs(difference) > 8 && Math.abs(difference) > Math.abs(event.clientY - drag.current.y) * 1.2) setPaused(true)
      return
    }
    if (Math.abs(difference) > 7) {
      setPaused(true)
      suppressClick.current = true
      track.current.setPointerCapture(event.pointerId)
      track.current.classList.add('is-dragging')
      track.current.scrollLeft = drag.current.left - difference
    }
  }
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (track.current?.hasPointerCapture(event.pointerId)) track.current.releasePointerCapture(event.pointerId)
    track.current?.classList.remove('is-dragging')
    drag.current = null
  }

  return <div ref={root} className={`photo-carousel carousel--${variant}`} role="region" aria-roledescription="carrusel" aria-label={label} data-playing={playing} data-count={photos.length} onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); drag.current = null; track.current?.classList.remove('is-dragging') }} onFocusCapture={(event) => setFocused(!(event.target as Element).closest('.carousel-autoplay'))} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false) }}>
    <div className="carousel-track" id={id} ref={track} tabIndex={0} aria-label={`${label}. Deslizá o usá las flechas para recorrer las fotos.`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onWheel={(event) => { if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) { target.current = null; setPaused(true) } }} onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false } }} onKeyDown={(event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); go(active + 1) }
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(active - 1) }
      if (event.key === 'Home') { event.preventDefault(); go(0) }
      if (event.key === 'End') { event.preventDefault(); go(photos.length - 1) }
    }}>
      {photos.map((photo, index) => <div className={`carousel-slide ${index === active ? 'is-current' : ''}`} key={photo.id} role="group" aria-roledescription="diapositiva" aria-label={`${index + 1} de ${photos.length}: ${photo.description}`}>
        <button className="carousel-photo-button" tabIndex={index === active ? 0 : -1} onClick={() => { setPaused(true); onOpen(photos, index) }} aria-label={`Ampliar: ${photo.description}`}>
          <img src={imageUrl(photo.id, 1400)} srcSet={imageSources(photo.id)} sizes={variant === 'hero' ? '100vw' : variant === 'showcase' ? '(max-width: 767px) 86vw, 64vw' : '(max-width: 767px) 92vw, 640px'} {...imageDimensions(photo.id)} alt={photo.description} loading={priority && index === 0 || visible && Math.abs(active - index) <= 1 ? 'eager' : 'lazy'} fetchPriority={priority && index === 0 ? 'high' : 'auto'} decoding="async" draggable={false} onError={() => setImageErrors((previous) => new Set(previous).add(photo.id))} />
          {imageErrors.has(photo.id) && <span className="carousel-image-error">La foto no se pudo cargar. Tocá para volver a verla.</span>}
          <span className="carousel-expand"><Icon name="expand" size={19} /><span>Ver detalle</span></span>
          {!!photo.detailIds?.length && <span className="photo-detail-count"><Icon name="slides" size={14} />{photo.detailIds.length + 1} fotos</span>}
        </button>
        <div className="carousel-slide-caption"><span>{String(index + 1).padStart(2, '0')}</span><div><span className="carousel-slide-category">{categories.find((item) => item.id === photo.category)?.label}</span><p>{photo.description}</p></div></div>
      </div>)}
    </div>
    <div className="carousel-chrome">
      <div className="carousel-current"><span className="carousel-label">{variant === 'hero' ? 'OBRAS SELECCIONADAS' : 'FOTOGRAFÍAS REALES'}</span><span className="carousel-current-title">{current.description}</span></div>
      <div className="carousel-controls">
        <span className="carousel-count" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">{String(active + 1).padStart(2, '0')}<span> / {String(photos.length).padStart(2, '0')}</span></span>
        {photos.length > 1 && <><button className="carousel-control carousel-autoplay" aria-label={paused || reduced ? `Activar avance automático: ${label}` : `Pausar avance automático: ${label}`} aria-controls={id} disabled={reduced} onClick={() => setPaused((value) => !value)}><Icon name={paused || reduced ? 'play' : 'pause'} size={15} /></button><button className="carousel-control" aria-label={`Foto anterior: ${label}`} aria-controls={id} onClick={() => go(active - 1)}><Icon name="chevron-left" size={19} /></button><button className="carousel-control" aria-label={`Foto siguiente: ${label}`} aria-controls={id} onClick={() => go(active + 1)}><Icon name="chevron-right" size={19} /></button></>}
      </div>
    </div>
    <div className="carousel-progress" aria-hidden="true"><span key={`${active}-${paused}`} style={{ animationDuration: `${interval}ms`, animationPlayState: playing ? 'running' : 'paused' }} /></div>
    {variant === 'hero' && <div className="hero-slide-tabs" role="group" aria-label="Elegir obra de portada">{photos.map((photo, index) => <button className={active === index ? 'is-active' : ''} aria-pressed={active === index} key={photo.id} onClick={() => go(index)}><span>0{index + 1}</span>{categories.find((item) => item.id === photo.category)?.label}</button>)}</div>}
    <span className="carousel-swipe-hint" aria-hidden="true"><Icon name="arrow" size={14} />Deslizá para explorar</span>
  </div>
}
