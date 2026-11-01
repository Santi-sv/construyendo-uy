import { Icon } from './Icons'
import { imageDimensions, imageSources, imageUrl } from '../lib/gallery'
import type { Project } from '../lib/gallery'
import '../work-introduction.css'

export function WorkIntroduction({ photo }: { photo: Project }) {
  return <section id="antes-de-empezar" className="work-introduction" aria-labelledby="work-introduction-title">
    <div className="work-introduction-inner container">
      <div className="work-introduction-visit">
        <figure className="work-introduction-photo">
          <img src={imageUrl(photo.id, 640)} srcSet={imageSources(photo.id)} sizes="(max-width: 767px) 96px, 128px" {...imageDimensions(photo.id)} alt={photo.description} loading="lazy" decoding="async" />
          <figcaption>Detalle de colocación</figcaption>
        </figure>
        <div className="work-introduction-copy">
          <span className="work-introduction-label">PRESUPUESTO EN OBRA</span>
          <h2 id="work-introduction-title">Primero, vemos<br /><span>tu obra.</span></h2>
          <p className="work-introduction-policy"><strong>Sin cargo en la ciudad de Maldonado y Punta del Este.</strong><span>Otras zonas: visita con costo según ubicación.</span></p>
          <a className="work-introduction-zones" href="#coverage-title">Ver zonas y condiciones<Icon name="arrow" size={16} /></a>
        </div>
      </div>
      <div className="work-introduction-details">
        <a className="work-introduction-detail" href="#formas-de-pago">
          <div><span className="work-introduction-label">FORMAS DE PAGO</span><h3>Efectivo o transferencia</h3><p>Lo definimos al preparar el presupuesto.</p></div>
          <Icon name="arrow" size={20} />
        </a>
        <a className="work-introduction-detail" href="#como-trabajamos">
          <div><span className="work-introduction-label">COLOCACIÓN Y TERMINACIONES</span><h3>Nivelación, juntas y cortes</h3><p>Conocé cómo trabajamos cada revestimiento.</p></div>
          <Icon name="arrow" size={20} />
        </a>
      </div>
    </div>
  </section>
}
