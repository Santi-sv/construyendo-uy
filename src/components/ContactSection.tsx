import type { Project } from '../lib/gallery'
import { freeVisitPolicy } from '../lib/quotes'
import { ButtonFlourish } from './ButtonFlourish'
import { Icon } from './Icons'
import { PhotoCarousel } from './PhotoCarousel'
import { ContactActions } from './ContactActions'
import { assetUrl } from '../lib/assets'

export function ContactSection({ photos, onOpen }: { photos: Project[]; onOpen: (photos: Project[], index: number) => void }) {
  return <section id="contacto" className="contact-section" aria-labelledby="contact-title">
    <div className="container contact-inner">
      <div className="contact-copy" data-reveal="up">
        <span className="eyebrow"><span className="contact-dot" />TU PRÓXIMO PROYECTO EMPIEZA ACÁ</span>
        <h2 id="contact-title">¿Qué querés<br />revestir?</h2>
        <p>Por WhatsApp o por teléfono.<br />Elegí cómo te queda más cómodo.</p>
        <ContactActions />
      </div>
      <div className="contact-action" data-reveal="up">
        <div className="contact-photo"><PhotoCarousel photos={photos} label="Imaginá tu próximo revestimiento" variant="mini" onOpen={onOpen} /></div>
        <a className="save-contact button--fizzy" href={assetUrl('contacto.vcf')} download="ConstruYENDO-Revestimientos.vcf"><ButtonFlourish kind="fizzy" /><span className="fizzy-download-icon"><Icon name="download" size={18} /></span><span>Guardar contacto</span></a>
        <span className="contact-visit-note">{freeVisitPolicy}</span>
      </div>
    </div>
  </section>
}
