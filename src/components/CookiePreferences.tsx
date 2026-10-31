import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icons'
import { readPrivacy, savePrivacy } from '../lib/privacy'
import type { PrivacyChoice } from '../lib/privacy'
import '../privacy.css'

function CookieIcon() {
  return <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M24.5 14.6A10.6 10.6 0 1 1 13.4 3.5a5.7 5.7 0 0 0 6.1 6.1 5 5 0 0 0 5 5Z" stroke="currentColor" strokeWidth="1.5" /><circle cx="9" cy="11" r="1.3" fill="currentColor"/><circle cx="16" cy="18" r="1.5" fill="currentColor"/><circle cx="8.5" cy="18.5" r="1" fill="currentColor"/><circle cx="16.5" cy="11.5" r=".9" fill="currentColor"/></svg>
}
export function CookiePreferences() {
  const [choice, setChoice] = useState<PrivacyChoice | null>(readPrivacy)
  const [settings, setSettings] = useState(false)
  const [preferences, setPreferences] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const open = () => { setPreferences(readPrivacy()?.preferences ?? false); setSettings(true) }
  const accept = (enabled: boolean) => { setChoice(savePrivacy(enabled)); setSettings(false) }
  useEffect(() => { if (settings) dialog.current?.showModal() }, [settings])
  return <>
    <button className="privacy-footer-link" type="button" onClick={open}><CookieIcon />Cookies y privacidad</button>
    {!choice && <section className="privacy-banner" aria-label="Preferencias de cookies">
      <span className="privacy-symbol"><CookieIcon /></span>
      <div className="privacy-banner-copy"><span className="privacy-kicker">TU PRIVACIDAD</span><h2>Vos elegís qué recordamos.</h2><p>Podemos guardar la categoría de trabajos que preferís. No utilizamos cookies de publicidad ni de analítica.</p></div>
      <div className="privacy-actions"><button type="button" className="privacy-button privacy-button--outline" onClick={() => accept(false)}>Solo necesarias</button><button type="button" className="privacy-button privacy-button--outline" onClick={open}>Configurar</button><button type="button" className="privacy-button privacy-button--gold" onClick={() => accept(true)}>Aceptar preferencias<Icon name="check" size={16} /></button></div>
    </section>}
    {settings && <dialog ref={dialog} className="privacy-dialog" aria-labelledby="privacy-title" onCancel={() => setSettings(false)} onClose={() => setSettings(false)}>
      <div className="privacy-dialog-head"><div><span className="privacy-kicker">CONSTRUYENDO · PRIVACIDAD</span><h2 id="privacy-title">Tus preferencias.</h2></div><button type="button" className="privacy-close" onClick={() => setSettings(false)} aria-label="Cerrar preferencias"><Icon name="close" size={20} /></button></div>
      <p>Elegí si querés que recordemos tu selección de la galería. Podés cambiar esta decisión cuando quieras desde el pie de página.</p>
      <div className="privacy-option"><div><h3>Necesarias</h3><p>Guardan tu elección sobre cookies durante seis meses.</p></div><span className="privacy-required">Siempre activas</span></div>
      <label className="privacy-option privacy-option--selectable"><div><h3>Recordar la categoría de trabajos</h3><p>La próxima visita se abrirá la misma categoría de la galería. Si desactivás esta opción, borramos esa preferencia guardada.</p></div><input type="checkbox" checked={preferences} onChange={event => setPreferences(event.target.checked)} aria-label="Recordar la categoría de trabajos" /></label>
      <div className="privacy-details"><h3>Sin seguimiento publicitario</h3><p>No usamos herramientas de analítica ni publicidad. Tu elección de cookies se guarda en este navegador y no contiene tu nombre ni datos de contacto.</p><h3>Tu consulta, en tus manos</h3><p>El pedido de presupuesto se prepara en tu navegador. ConstruYENDO recibe el mensaje cuando vos lo enviás desde WhatsApp. Al abrir WhatsApp, se aplican también sus políticas de privacidad.</p></div>
      <div className="privacy-actions"><button type="button" className="privacy-button privacy-button--outline" onClick={() => accept(false)}>Solo necesarias</button><button type="button" className="privacy-button privacy-button--gold" onClick={() => accept(preferences)}>Guardar preferencias<Icon name="check" size={16} /></button></div>
    </dialog>}
  </>
}
