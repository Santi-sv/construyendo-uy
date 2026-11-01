import { Icon } from './Icons'
import { managedHero } from '../lib/managedContent'
import heroImage from '../data/hero-image.json'
import { freeVisitPolicy } from '../lib/quotes'
import { assetUrl } from '../lib/assets'

export function Hero() {
  const managed = managedHero()
  const image = managed?.image ?? heroImage
  const source = (value: string) => /^https?:/.test(value) ? value : assetUrl(value)
  const desktopSources = `${source(image.desktop.small.src)} ${image.desktop.small.width}w, ${source(image.desktop.large.src)} ${image.desktop.large.width}w`
  const mobileSources = `${source(image.mobile.small.src)} ${image.mobile.small.width}w, ${source(image.mobile.large.src)} ${image.mobile.large.width}w`
  return <section id="inicio" className="cinema-hero cinema-hero--workscene" aria-labelledby="hero-title">
    <figure className="workscene-media">
      <picture>
        <source media="(max-width: 767px)" srcSet={mobileSources} sizes="100vw" width={image.mobile.large.width} height={image.mobile.large.height} />
        <img className="workscene-image" src={source(image.desktop.large.src)} srcSet={desktopSources} sizes="100vw" width={image.desktop.large.width} height={image.desktop.large.height} alt={managed?.alt ?? "Imagen ilustrativa: dos instaladores de espalda colocando baldosas de gran formato con niveladores en el interior de una vivienda moderna."} fetchPriority="high" decoding="async" />
      </picture>
    </figure>
    <div className="cinema-copy container">
      <div className="cinema-eyebrow"><span className="status-dot" />REVESTIMIENTOS / MALDONADO, UY<span className="cinema-edition">OFICIO EN CADA DETALLE</span></div>
      <h1 id="hero-title"><span className="hero-line"><span>Revestimientos</span></span><span className="hero-line hero-line--accent"><span>a tu medida.</span></span></h1>
      <div className="cinema-copy-bottom"><p>Baños, pisos, piscinas, piedra y fachadas.<br /><strong>Colocación prolija, con atención a cada detalle.</strong></p><div className="cinema-actions"><a className="button button--architect button--halo" href="#presupuesto"><span>Pedir presupuesto</span><span className="button-arrow"><Icon name="arrow" size={22} /></span></a><a className="cinema-discover" href="#trabajos"><span>Conocé nuestros trabajos</span><span><Icon name="arrow-down" size={18} /></span></a></div><p className="cinema-fee-note">Visita y presupuesto {freeVisitPolicy.charAt(0).toLowerCase() + freeVisitPolicy.slice(1)}</p></div>
    </div>
    <div className="workscene-footer container"><div className="workscene-signature"><div><strong>Diseño · Calidad · Durabilidad</strong><span>De la preparación a la última junta.</span></div></div><a href="#trabajos" className="workscene-real-work">Ver obras reales<span><Icon name="arrow" size={18} /></span></a></div>
  </section>
}
