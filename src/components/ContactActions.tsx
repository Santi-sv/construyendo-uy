import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useReducedMotion } from '../hooks/useMotion'
import { contactMessage, phoneUrl, whatsappUrl } from '../lib/gallery'
import { CONTACT_LAUNCH_DELAY, CONTACT_RESET_DELAY, launchContact } from '../lib/contactLaunch'
import type { ContactChannel } from '../lib/contactLaunch'
import { Icon } from './Icons'

const actions = [
  { channel: 'whatsapp', label: 'Escribir por WhatsApp', href: whatsappUrl(contactMessage), icon: 'whatsapp', announcement: 'Abriendo WhatsApp para que puedas revisar tu mensaje.' },
  { channel: 'phone', label: 'Llamar por teléfono', href: phoneUrl, icon: 'phone', announcement: 'Abriendo la opción de llamada de tu dispositivo.' },
] as const

export function ContactActions({ onLaunch = launchContact }: { onLaunch?: (href: string, channel: ContactChannel) => void }) {
  const [active, setActive] = useState<ContactChannel | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [error, setError] = useState('')
  const pending = useRef<ContactChannel | null>(null)
  const launched = useRef(false)
  const launchTimer = useRef<number | undefined>(undefined)
  const resetTimer = useRef<number | undefined>(undefined)
  const reduced = useReducedMotion()

  const reset = useCallback(() => {
    window.clearTimeout(launchTimer.current)
    window.clearTimeout(resetTimer.current)
    pending.current = null
    launched.current = false
    setActive(null)
    setAnnouncement('')
  }, [])

  useEffect(() => {
    const restore = () => { if (launched.current) reset() }
    window.addEventListener('focus', restore)
    window.addEventListener('pageshow', restore)
    return () => {
      window.clearTimeout(launchTimer.current)
      window.clearTimeout(resetTimer.current)
      window.removeEventListener('focus', restore)
      window.removeEventListener('pageshow', restore)
    }
  }, [reset])

  function activate(event: MouseEvent<HTMLAnchorElement>, action: typeof actions[number]) {
    if (pending.current) { event.preventDefault(); return }
    // Preserve native open-in-new-tab gestures and the links' fallback behavior.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    pending.current = action.channel
    launched.current = false
    setActive(action.channel)
    setError('')
    setAnnouncement(action.announcement)
    const handoff = () => {
      launched.current = true
      try { onLaunch(action.href, action.channel) } catch {
        reset()
        setError('No se pudo abrir esta opción. Volvé a intentarlo.')
      }
    }
    resetTimer.current = window.setTimeout(reset, CONTACT_RESET_DELAY)
    if (reduced) handoff()
    else launchTimer.current = window.setTimeout(handoff, CONTACT_LAUNCH_DELAY)
  }

  return <>
    <div className="contact-options" role="group" aria-label="Opciones de contacto">
      {actions.map((action) => <a key={action.channel} className={`button contact-option contact-morph contact-morph--${action.channel} ${active === action.channel ? 'is-animating' : active ? 'is-blocked' : ''}`} href={action.href} target={action.channel === 'whatsapp' ? '_blank' : undefined} rel={action.channel === 'whatsapp' ? 'noopener noreferrer' : undefined} aria-label={action.label} aria-busy={active === action.channel || undefined} aria-disabled={!!active || undefined} onClick={(event) => activate(event, action)}>
        <span className="contact-morph-shape" aria-hidden="true"><span className="contact-morph-fill" /></span>
        <span className="contact-morph-content"><Icon name={action.icon} size={23} /><span>{action.label}</span><span className="contact-morph-arrow"><Icon name="arrow" size={19} /></span></span>
        <svg className="contact-morph-check" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 16 8 9L27 7" pathLength="1" /></svg>
      </a>)}
    </div>
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    {error && <p className="contact-action-error" role="alert">{error}</p>}
  </>
}
