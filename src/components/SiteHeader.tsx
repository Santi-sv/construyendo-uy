import { useEffect, useRef, useState } from 'react'
import { Brand, Icon } from './Icons'
import { NextArrow } from './NextArrow'
import { visitMessage, whatsappUrl } from '../lib/gallery'

const navigation = [
  { id: 'trabajos', label: 'Trabajos', icon: 'grid' },
  { id: 'como-trabajamos', label: 'Cómo trabajamos', icon: 'ruler' },
  { id: 'zona-y-pagos', label: 'Zona y pagos', icon: 'location' },
  { id: 'presupuesto', label: 'Presupuesto', icon: 'estimate' },
] as const

export function SiteHeader({ activeSection }: { activeSection: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const header = useRef<HTMLElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        toggle.current?.focus()
      }
    }
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const resize = () => { if (window.innerWidth > 1100) setMenuOpen(false) }
    document.addEventListener('keydown', keydown)
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', resize)
    return () => {
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('pointerdown', outside)
      window.removeEventListener('resize', resize)
    }
  }, [menuOpen])

  const closeMenu = () => {
    setMenuOpen(false)
    toggle.current?.focus({ preventScroll: true })
  }

  return <header className={`site-header site-header--refined ${menuOpen ? 'has-menu-open' : ''}`} ref={header}>
    <div className="page-scroll-progress" aria-hidden="true" />
    <div className="header-inner container">
      <a href="#inicio" className="brand-link" aria-label="ConstruYENDO Revestimientos, inicio" onClick={() => setMenuOpen(false)}><Brand /></a>
      <nav aria-label="Navegación principal" className="desktop-nav">
        {navigation.map((item) => <a key={item.id} href={`#${item.id}`} aria-current={activeSection === item.id ? 'location' : undefined}><Icon name={item.icon} size={17} /><span>{item.label}</span></a>)}
      </nav>
      <div className="header-actions">
        <button type="button" className="header-menu-toggle" ref={toggle} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button>
        <a href={whatsappUrl(visitMessage)} className="header-whatsapp next-cta next-cta--header" aria-label="Contactar a ConstruYENDO por WhatsApp" target="_blank" rel="noopener noreferrer"><span className="cta-shine" aria-hidden="true" /><Icon name="whatsapp" size={23} /><span className="header-contact-copy"><span className="next-label">Hablemos</span><small>POR WHATSAPP</small></span><NextArrow /></a>
      </div>
    </div>
    {menuOpen && <nav id="mobile-navigation" className="mobile-nav container" aria-label="Navegación en celular"><span className="mobile-nav-kicker">EXPLORÁ CONSTRUYENDO</span>{navigation.map((item, index) => <a key={item.id} href={`#${item.id}`} aria-current={activeSection === item.id ? 'location' : undefined} onClick={closeMenu}><span className="mobile-nav-icon"><Icon name={item.icon} size={22} /></span><span>{item.label}</span><small>0{index + 1}</small><Icon name="arrow" size={19} /></a>)}</nav>}
  </header>
}
