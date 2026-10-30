import { useEffect, useRef, useState } from 'react'
import { Brand, Icon } from './Icons'
import type { IconName } from './Icons'
import { freeVisitPolicy } from '../lib/quotes'

const serviceIcons: Record<string, IconName> = { 'Baño': 'bath', 'Piso': 'tile', 'Piscina': 'pool', 'Piedra librillo': 'stone', 'Escalera': 'stairs', 'Fachada': 'facade', 'Otro revestimiento': 'ruler' }

type Props = {
  service: string
  location: string
  freeVisit: boolean
  zoneChosen: boolean
  ready: boolean
  message: string
}

export function QuotePreview({ service, location, freeVisit, zoneChosen, ready, message }: Props) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const messageRef = useRef<HTMLParagraphElement>(null)
  const completed = Number(!!service) + Number(!!location)
  const hasDraft = !!service || !!location
  const nextField = !service ? 'quote-service' : zoneChosen ? 'quote-other-location' : 'quote-zone'
  const nextPrompt = !service ? 'Elegí el tipo de trabajo.' : zoneChosen ? 'Completá la localidad de tu obra.' : 'Elegí dónde está tu obra.'

  useEffect(() => { setCopyStatus('idle') }, [message])

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message)
      setCopyStatus('copied')
    } catch {
      const selection = window.getSelection()
      if (selection && messageRef.current) {
        const range = document.createRange()
        range.selectNodeContents(messageRef.current)
        selection.removeAllRanges()
        selection.addRange(range)
      }
      setCopyStatus('error')
    }
  }

  function editField(id: string) {
    document.getElementById(id)?.focus()
  }

  return <aside id="vista-pedido" className="quote-preview quote-preview--project quote-preview--brief" data-ready={ready} data-reveal="up" aria-label="Vista previa del pedido">
    <div className="brief-header">
      <div className="brief-brand-row"><span className="brief-brand"><Brand light /></span><span className="brief-preview-label">VISTA PREVIA</span></div>
      <div className="brief-heading"><div><h3>Tu pedido<span>.</span></h3><span className={`brief-status ${ready ? 'is-ready' : ''}`} role="status">{ready ? 'Listo para revisar' : `${completed} de 2 datos completos`}</span></div><div className="brief-progress" role="progressbar" aria-label="Datos completos del pedido" aria-valuemin={0} aria-valuemax={2} aria-valuenow={completed}><svg viewBox="0 0 54 54" width="60" height="60" aria-hidden="true"><circle className="brief-progress-track" cx="27" cy="27" r="23" /><circle className="brief-progress-value" cx="27" cy="27" r="23" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - completed * 50} opacity={completed ? 1 : 0} /></svg><strong>{completed}<small>/2</small></strong></div></div>
    </div>

    <div className="brief-content">
      <div className="brief-fields">
        <button type="button" className={`brief-field brief-field--service ${service ? 'is-complete' : ''}`} onClick={() => editField('quote-service')} aria-label="Editar tipo de trabajo"><span className="brief-field-heading">01 / TRABAJO<Icon name={service ? 'check' : 'chevron-right'} size={14} /></span><span className="brief-field-icon"><Icon name={serviceIcons[service] || 'ruler'} size={28} /></span><strong>{service || 'Elegí el trabajo'}</strong></button>
        <button type="button" className={`brief-field brief-field--location ${location ? 'is-complete' : ''}`} onClick={() => editField(zoneChosen && !location ? 'quote-other-location' : 'quote-zone')} aria-label="Editar ubicación de la obra"><span className="brief-field-heading">02 / UBICACIÓN<Icon name={location ? 'check' : 'chevron-right'} size={14} /></span><span className="brief-field-icon"><Icon name="location" size={28} /></span><strong>{location || 'Elegí la zona'}</strong></button>
      </div>

      {hasDraft ? <div className={`brief-message ${ready ? 'is-ready' : ''}`}>
        <div className="brief-message-heading"><span><Icon name="whatsapp" size={17} />{ready ? 'TU MENSAJE ESTÁ LISTO' : 'TU MENSAJE TOMA FORMA'}</span>{ready && <button type="button" onClick={copyMessage}><Icon name={copyStatus === 'copied' ? 'check' : 'copy'} size={15} /><span>{copyStatus === 'copied' ? 'Copiado' : 'Copiar'}</span></button>}</div>
        <div className="brief-message-scroll" tabIndex={0} role="group" aria-label="Texto del mensaje preparado"><p ref={messageRef}>{message}</p></div>
        <span className="brief-message-feedback" role="status">{copyStatus === 'copied' ? 'Mensaje copiado.' : copyStatus === 'error' ? 'Mensaje seleccionado para que puedas copiarlo.' : ''}</span>
      </div> : <div className="brief-empty"><div className="brief-empty-heading"><span className="brief-empty-icon"><Icon name="message" size={32} /></span><h4>Tu mensaje empieza acá.</h4></div><p>Contanos qué querés revestir y dónde está la obra. El mensaje se arma acá.</p></div>}

      {!ready && hasDraft && <button type="button" className="brief-next-step" onClick={() => editField(nextField)}><Icon name="arrow" size={16} /><span>{nextPrompt}</span></button>}

      <div className={`brief-visit-note ${freeVisit ? 'is-free' : zoneChosen ? 'is-paid' : ''}`}><span className="brief-visit-icon"><Icon name={freeVisit ? 'check' : 'visit'} size={21} /></span><p><strong>{zoneChosen ? freeVisit ? 'Visita y presupuesto sin cargo' : 'Visita con costo según la zona' : 'Primero, una visita a tu obra'}</strong><span>{zoneChosen ? freeVisit ? 'En la ciudad de Maldonado y Punta del Este.' : 'Consultamos el importe antes de coordinar.' : freeVisitPolicy}</span></p></div>
      <p className="brief-footer"><Icon name="whatsapp" size={13} />Revisás el mensaje y lo enviás desde WhatsApp.</p>
    </div>
  </aside>
}
