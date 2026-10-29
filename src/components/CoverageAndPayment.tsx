import { Icon } from './Icons'
import { PaymentPanel } from './PaymentPanel'
import { contactMessage, whatsappUrl } from '../lib/gallery'

const locations = ['Maldonado ciudad', 'Punta del Este', 'Punta Ballena', 'Pan de Azúcar', 'Piriápolis', 'José Ignacio', 'La Capuera']

export function CoverageAndPayment() {
  return <div className="coverage-payment-grid container">
    <article className="coverage-card" data-reveal="left" aria-labelledby="coverage-title">
      <div className="coverage-card-top"><span className="eyebrow"><span className="small-line" />DÓNDE TRABAJAMOS</span><span className="coverage-stamp"><Icon name="location" size={22} /><span>URUGUAY<br /><strong>MALDONADO</strong></span></span></div>
      <h2 id="coverage-title">Todo<br /><span>Maldonado.</span></h2>
      <p className="coverage-intro">De la costa al interior, nos acercamos a tu obra.</p>
      <div className="coverage-locations" aria-label="Zonas de trabajo">{locations.map((location, index) => <span key={location}><small>{String(index + 1).padStart(2, '0')}</small>{location}<span className={`coverage-zone-status ${index < 2 ? 'coverage-zone-status--free' : ''}`}>{index < 2 ? 'Sin cargo' : 'Con costo según zona'}</span></span>)}<span className="coverage-all"><Icon name="arrow" size={15} />Y todo el departamento</span></div>
      <div className="coverage-visit"><span className="coverage-visit-icon"><Icon name="visit" size={24} /></span><div><strong>Ciudad de Maldonado y Punta del Este.</strong><p>Visita y presupuesto sin cargo.</p></div><Icon name="check" size={21} /></div>
      <p className="coverage-transport">En las demás zonas, la visita para presupuestar tiene costo según la ubicación. Consultá el importe antes de coordinar.</p>
      <a href={whatsappUrl(contactMessage)} className="coverage-outside" target="_blank" rel="noopener noreferrer"><span>¿Tu obra está fuera de Maldonado?<strong>Escribinos y lo vemos.</strong></span><span className="coverage-link-arrow gradient-orbit"><Icon name="arrow" size={20} /></span></a>
    </article>

    <PaymentPanel />
  </div>
}
