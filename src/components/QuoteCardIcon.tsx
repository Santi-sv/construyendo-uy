import type { ReactNode } from 'react'
import type { quoteServices } from '../lib/quotes'

type Kind = typeof quoteServices[number] | 'location'

/** Dibujos compactos para las etiquetas sobre fotografías. */
export function QuoteCardIcon({ kind }: { kind: string }) {
  const drawings: Record<Kind, ReactNode> = {
    'Baño': <><path d="M4 13h20l-2 8H6Z" fill="currentColor" fillOpacity=".16" /><path d="M7 13V6a3 3 0 0 1 6 0v2M11 8h4M8 21v3m12-3v3" /><path d="M12 10v1m3-1v1" strokeOpacity=".65" /></>,
    'Piso': <><path d="m3 12 11-7 11 7-11 7Z" fill="currentColor" fillOpacity=".16" /><path d="m3 17 11 7 11-7M8.5 8.5l11 7m-11 0 11-7" /></>,
    'Piscina': <><path d="M7 16V6a2.5 2.5 0 0 1 5 0m3 10V6a2.5 2.5 0 0 1 5 0M7 9h8M7 13h8" /><path d="M3 19q2.75-3 5.5 0t5.5 0 5.5 0 5.5 0M3 24q2.75-3 5.5 0t5.5 0 5.5 0 5.5 0" strokeOpacity=".8" /></>,
    'Piedra librillo': <><rect x="4" y="5" width="20" height="18" rx="2" fill="currentColor" fillOpacity=".16" /><path d="M4 11h20M4 17h20M12 5v6m5 0v6M10 17v6" /></>,
    'Escalera': <><path d="M4 23v-6h6v-6h7V5h7v18Z" fill="currentColor" fillOpacity=".16" /><path d="M10 17v6m7-12v12" strokeOpacity=".55" /></>,
    'Fachada': <><path d="m5 9 9-5 9 5v15H5Z" fill="currentColor" fillOpacity=".16" /><path d="M14 4v20M5 14h18M5 19h18" strokeOpacity=".8" /></>,
    'Otro revestimiento': <><path d="m4 18 14-14 6 6-14 14Z" fill="currentColor" fillOpacity=".16" /><path d="m9 13 3 3m1-7 3 3m1-7 3 3" /></>,
    location: <><path d="M14 25S6 17.2 6 10a8 8 0 0 1 16 0c0 7.2-8 15-8 15Z" fill="currentColor" fillOpacity=".17" /><circle cx="14" cy="10" r="3" fill="currentColor" stroke="none" /><path d="M9 9a5 5 0 0 1 4-4" stroke="white" strokeOpacity=".5" /></>,
  }

  const drawing = Object.hasOwn(drawings, kind) ? drawings[kind as Kind] : drawings['Otro revestimiento']
  return <svg className="quote-card-icon" width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{drawing}</svg>
}
