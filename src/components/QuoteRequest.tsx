import { useState } from 'react'
import { buildQuoteMessage, quoteServices, quoteZones } from '../lib/quotes'
import { whatsappUrl } from '../lib/gallery'
import { Icon } from './Icons'
import { QuotePreview } from './QuotePreview'
import { ButtonFlourish } from './ButtonFlourish'

export function QuoteRequest() {
  const [service, setService] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [otherLocation, setOtherLocation] = useState('')
  const [details, setDetails] = useState('')
  const zone = quoteZones.find((item) => item.id === zoneId)
  const ready = !!service && !!zoneId && (zoneId !== 'otra' || !!otherLocation.trim())
  const message = buildQuoteMessage({ service, zoneId, otherLocation, details })
  const location = zoneId === 'otra' ? otherLocation.trim() : zone?.label || ''

  return <section id="presupuesto" className="quote-section section-space" aria-labelledby="quote-title">
    <div className="container">
      <div className="section-heading" data-reveal="up"><div><span className="eyebrow section-kicker"><span className="small-line" />TU OBRA EMPIEZA CON UN MENSAJE</span><h2 id="quote-title">Armá tu pedido<br />de presupuesto<span className="heading-dot">.</span></h2></div><p>Elegí el trabajo y la ubicación.<br />Te dejamos el mensaje listo para WhatsApp.</p></div>
      <div className="quote-layout">
        <form className="quote-form" data-reveal="up" onSubmit={(event) => {
          event.preventDefault()
          if (ready) window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer')
        }}>
          <div className="quote-field"><label htmlFor="quote-service"><span>01</span>¿Qué querés revestir?</label><div className="quote-select-wrap"><select id="quote-service" required value={service} onChange={(event) => setService(event.target.value)}><option value="" disabled>Elegí el tipo de trabajo</option>{quoteServices.map((item) => <option key={item} value={item}>{item}</option>)}</select><Icon name="chevron-right" size={17} /></div></div>
          <div className="quote-field"><label htmlFor="quote-zone"><span>02</span>¿Dónde está la obra?</label><div className="quote-select-wrap"><select id="quote-zone" required value={zoneId} onChange={(event) => setZoneId(event.target.value)}><option value="" disabled>Elegí la zona</option>{quoteZones.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><Icon name="chevron-right" size={17} /></div>
            {zoneId === 'otra' && <div className="quote-other-zone"><label htmlFor="quote-other-location">Localidad o zona</label><input id="quote-other-location" required maxLength={100} autoComplete="address-level2" placeholder="Por ejemplo: San Carlos" value={otherLocation} onChange={(event) => setOtherLocation(event.target.value)} /></div>}
            <div className={`quote-fee-note ${zone ? zone.free ? 'quote-fee-note--free' : 'quote-fee-note--paid' : ''}`} role="status"><Icon name={zone?.free ? 'check' : 'location'} size={18} /><p>{zone ? zone.free ? <><strong>Visita y presupuesto sin cargo.</strong> Solo en la ciudad de Maldonado y Punta del Este.</> : <><strong>Esta zona tiene costo para presupuestar.</strong> Consultamos el importe por WhatsApp antes de coordinar la visita.</> : <><strong>El costo depende de la ubicación.</strong> Sin cargo en Maldonado ciudad y Punta del Este. Las demás zonas tienen costo según ubicación.</>}</p></div>
          </div>
          <div className="quote-field quote-field--details"><label htmlFor="quote-details"><span>03</span>Un poco más sobre tu proyecto<small>OPCIONAL</small></label><textarea id="quote-details" rows={3} maxLength={600} placeholder="Contanos qué tenés en mente. Si sabés las medidas o el material, podés incluirlos." value={details} onChange={(event) => setDetails(event.target.value)} /><span className="quote-character-count">{details.length} / 600</span></div>
          <button type="submit" className="button quote-send-button button--bubble"><ButtonFlourish kind="bubble" /><Icon name="whatsapp" size={23} /><span>Abrir pedido en WhatsApp</span><Icon name="arrow" size={21} /></button>
          <p className="quote-submit-note">Vas a poder revisar el mensaje y enviarlo desde WhatsApp.</p>
        </form>

        <QuotePreview service={service} location={location} freeVisit={!!zone?.free} zoneChosen={!!zone} ready={ready} message={message} />
      </div>
    </div>
  </section>
}
