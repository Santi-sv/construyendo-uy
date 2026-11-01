import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Brand, Icon } from './components/Icons'
import { Hero } from './components/Hero'
import { WorkIntroduction } from './components/WorkIntroduction'
import { SiteHeader } from './components/SiteHeader'
import { CoverageAndPayment } from './components/CoverageAndPayment'
import { QuoteRequest } from './components/QuoteRequest'
import { ContactSection } from './components/ContactSection'
import { NextArrow } from './components/NextArrow'
import { PhotoCarousel } from './components/PhotoCarousel'
import { PortfolioExplorer } from './components/PortfolioExplorer'
import type { GalleryMode } from './components/PortfolioExplorer'
import { usePageProgress, useScrollReveal } from './hooks/useMotion'
import { Lightbox } from './components/Lightbox'
import { categories, findProject, imageDimensions, imageSources, imageUrl, projects, savedCategory, visitMessage, whatsappUrl, withPhotoDetails } from './lib/gallery'
import type { Category, Project } from './lib/gallery'
import processPhotos from './data/process.json'
import { adminUrl } from './lib/managedContent'
import { CookiePreferences } from './components/CookiePreferences'
import { privacyChanged, rememberCategory } from './lib/privacy'

const steps = [
  { title: 'Nos escribís', text: 'Contanos por WhatsApp qué querés revestir y en qué zona. Si tenés fotos del lugar, mandalas.' },
  { title: 'Vamos a ver el trabajo', text: 'Cada obra es distinta, por eso el presupuesto siempre se hace en el lugar. La visita y el presupuesto son sin cargo en la ciudad de Maldonado y Punta del Este. En las demás zonas tienen costo según la ubicación.' },
  { title: 'Te pasamos el presupuesto', text: 'Con el trabajo a la vista acordamos el precio, la forma de pago y los plazos.' },
  { title: 'Colocamos el revestimiento', text: 'Trabajamos en la preparación, colocación y terminación del revestimiento, cuidando cada detalle.' },
]
const processProjects: Project[] = processPhotos.map((photo, index) => (findProject(photo.id) ?? { ...photo, category: index === 1 ? 'banos' : index === 2 ? 'escaleras' : 'pisos' }))
const projectById = (id: string) => findProject(id)!
const workflowPhotos = [processProjects[0], processProjects[1], projectById('bano-madera-oxido')]
const areaPhotos = ['piscina-escalera', 'escalera-exterior', 'librillo-fachada'].map(projectById)
const contactPhotos = ['bano-madera-oxido', 'librillo-pared', 'piso-marmol-negro'].map(projectById)
const stepIcons = ['message', 'visit', 'estimate', 'tile'] as const
const qualityIcons = ['level', 'joint', 'cut'] as const

function App() {
  const [category, setCategory] = useState<Category>(savedCategory)
  const [lightbox, setLightbox] = useState<{ photos: Project[]; index: number } | null>(null)
  const [galleryMode, setGalleryMode] = useState<GalleryMode>('slides')
  const [activeSection, setActiveSection] = useState('')
  const [masonry, setMasonry] = useState({ columnWidth: 250, rowHeight: 4, gap: 16 })
  const galleryRef = useRef<HTMLDivElement>(null)
  useScrollReveal(`${category}-${galleryMode}`)
  usePageProgress()
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id) return
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' }))
    return () => cancelAnimationFrame(frame)
  }, [])
  const openPhotos = (photos: Project[], index: number) => {
    const expanded = withPhotoDetails(photos)
    setLightbox({ photos: expanded, index: expanded.findIndex((photo) => photo.id === photos[index].id) })
  }
  const filtered = useMemo(() => projects.filter((project) => category === 'todos' || project.category === category), [category])

  useLayoutEffect(() => {
    const gallery = galleryRef.current
    if (!gallery) return
    const resize = () => {
      const style = getComputedStyle(gallery)
      const columns = style.gridTemplateColumns.split(' ').length
      const gap = parseFloat(style.columnGap)
      const columnWidth = (gallery.clientWidth - gap * (columns - 1)) / columns
      const rowHeight = parseFloat(style.gridAutoRows)
      setMasonry((previous) => previous.columnWidth === columnWidth && previous.gap === gap ? previous : { columnWidth, rowHeight, gap })
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(gallery)
    return () => observer.disconnect()
  }, [galleryMode])

  useEffect(() => {
    const save = () => rememberCategory(category)
    save()
    window.addEventListener(privacyChanged, save)
    return () => window.removeEventListener(privacyChanged, save)
  }, [category])


  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id)
    }, { rootMargin: '-15% 0px -65% 0px' })
    document.querySelectorAll('main section[id]').forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])


  return (
    <>
      <a href="#contenido" className="skip-link">Ir al contenido</a>
      <SiteHeader activeSection={activeSection} />

      <main id="contenido">
        <Hero />

        <WorkIntroduction photo={processProjects[0]} />

        <section id="trabajos" className="work-section section-space container">
          <div className="section-heading" data-reveal="up"><div><span className="eyebrow section-kicker"><span className="small-line" />NUESTRO PORTAFOLIO</span><h2>Nuestros trabajos<span className="heading-dot">.</span></h2></div><p>Obras reales. Materiales que se sienten.<br className="desktop-break" /> Deslizá para explorar o tocá para ver el detalle.</p></div>
          <PortfolioExplorer category={category} mode={galleryMode} onCategoryChange={setCategory} onModeChange={setGalleryMode} />
          <div id="portfolio-results" className="portfolio-results" role="region" aria-label="Trabajos seleccionados">
          {filtered.length === 0 ? <p className="gallery-empty">Todavía no hay fotos para mostrar en esta categoría.</p> : galleryMode === 'slides' ? <div className="showcase-reveal" data-reveal="up"><PhotoCarousel key={category} photos={filtered} label="Nuestros trabajos" variant="showcase" onOpen={openPhotos} /></div> : <div className="gallery-grid" ref={galleryRef}>{filtered.map((project, index) => (
            <button type="button" className="project-card" style={{ gridRowEnd: `span ${Math.ceil((masonry.columnWidth * imageDimensions(project.id).height / imageDimensions(project.id).width + masonry.gap) / (masonry.rowHeight + masonry.gap))}` }} key={project.id} onClick={() => openPhotos(filtered, index)} aria-label={`Ver foto: ${project.description}`}>
              <img src={imageUrl(project.id, 1400)} srcSet={imageSources(project.id)} sizes="(max-width: 767px) 46vw, (max-width: 1100px) 30vw, 24vw" {...imageDimensions(project.id)} alt={project.description} loading="lazy" decoding="async" />
              <span className="project-expand"><Icon name="expand" size={17} /></span>
              {!!project.detailIds?.length && <span className="photo-detail-count"><Icon name="slides" size={14} />{project.detailIds.length + 1} fotos</span>}
              <span className="project-caption"><span className="project-category">{categories.find((item) => item.id === project.category)?.label}</span><span className="project-description">{project.description}</span><Icon name="arrow" size={20} /></span>
            </button>
          ))}</div>}
          </div>
          <div className="gallery-section-action" data-reveal="up"><p>Tu espacio, con tu impronta.</p><a className="button button--outline next-cta next-cta--whatsapp" href={whatsappUrl(visitMessage)} target="_blank" rel="noopener noreferrer"><span className="cta-shine" aria-hidden="true" /><Icon name="whatsapp" size={21} /><span className="next-label">Conversemos sobre tu obra</span><NextArrow /></a></div>
          <div className="gallery-footnote"><span><span className="status-dot" />Trabajos reales. Cada uno, a su medida.</span><span>{filtered.length.toString().padStart(2, '0')} FOTOS / {categories.find((item) => item.id === category)?.label.toLocaleUpperCase('es')}</span></div>
        </section>

        <section id="como-trabajamos" className="how-section section-space">
          <div className="container"><div className="section-heading" data-reveal="up"><div><span className="eyebrow section-kicker"><span className="small-line" />SIMPLE, DE PRINCIPIO A FIN</span><h2>Cómo trabajamos<span className="heading-dot">.</span></h2></div><p>Un trato directo. Un presupuesto claro.<br className="desktop-break" /> Y todo resuelto, hasta el último detalle.</p></div>
            <div className="how-story"><div className="how-photo" data-reveal="left"><PhotoCarousel photos={workflowPhotos} label="Del proceso a la terminación" variant="editorial" scrollAdvance onOpen={openPhotos} /><span className="how-photo-note">EL OFICIO ESTÁ EN CADA DETALLE.</span></div><div className="steps-grid">{steps.map((step, index) => <article className="step" data-reveal="up" key={step.title}><div className="step-top"><span className="step-number">0{index + 1}</span><Icon name={stepIcons[index]} size={29} /></div><h3>{step.title}</h3><p>{step.text}</p></article>)}</div></div>
            <a href={whatsappUrl(visitMessage)} className="process-cta-link" target="_blank" rel="noopener noreferrer"><span><Icon name="whatsapp" size={22} />Coordinemos una visita a tu obra</span><span className="round-arrow next-cta next-cta--whatsapp next-cta--icon"><NextArrow /></span></a>
          </div>
        </section>

        <section className="process-section section-space container" aria-labelledby="process-title">
          <div className="process-intro" data-reveal="up"><div><span className="eyebrow section-kicker"><span className="small-line" />ASÍ SE VE EL TRABAJO BIEN HECHO</span><h2 id="process-title">La nivelación<br />hace la diferencia<span className="heading-dot">.</span></h2></div><div className="process-copy"><p>En piezas de gran formato un milímetro se nota. Por eso colocamos con sistema de nivelación, pieza por pieza.</p><ul className="quality-list">{['Superficie plana, sin cejas entre piezas', 'Juntas parejas en pisos y paredes', 'Cortes a medida en encuentros y esquinas'].map((text, index) => <li key={text}><span><Icon name={qualityIcons[index]} size={20} /></span>{text}</li>)}</ul></div></div>
          <div data-reveal="up"><PhotoCarousel photos={processProjects} label="La precisión durante la obra" variant="process" scrollAdvance onOpen={openPhotos} /></div>
          <p className="process-note"><span className="small-line" />La prolijidad también se ve durante la obra.</p>
        </section>

        <section id="zona-y-pagos" className="area-section" aria-label="Zona de trabajo y formas de pago"><div className="area-photo-section container" data-reveal="up"><div className="area-photo-heading"><span className="eyebrow section-kicker"><span className="small-line" />DE ADENTRO HACIA AFUERA</span><p>Revestimientos para cada espacio.</p></div><PhotoCarousel photos={areaPhotos} label="Obras en exteriores" variant="strip" scrollAdvance onOpen={openPhotos} /></div><CoverageAndPayment /></section>

        <QuoteRequest />

        <ContactSection photos={contactPhotos} onOpen={openPhotos} />
      </main>

      <footer className="site-footer"><div className="container footer-inner"><a href="#inicio" aria-label="ConstruYENDO Revestimientos, volver al inicio"><Brand /></a><p>Revestimientos <span>·</span> Maldonado, Uruguay</p>{adminUrl && <a className="team-access" href={adminUrl}>Acceso del equipo</a>}<CookiePreferences /><a className="footer-domain" href="#inicio">Volver al inicio<Icon name="arrow" size={15} /></a></div></footer>
      <a href={whatsappUrl(visitMessage)} target="_blank" rel="noopener noreferrer" className="floating-whatsapp gradient-orbit" aria-label="Consultar presupuesto por WhatsApp"><Icon name="whatsapp" size={28} /><span>Hablemos de tu obra</span></a>
      {lightbox && <Lightbox photos={lightbox.photos} index={lightbox.index} onIndexChange={(index) => setLightbox((previous) => previous ? { ...previous, index } : null)} onClose={() => setLightbox(null)} />}
    </>
  )
}

export default App
