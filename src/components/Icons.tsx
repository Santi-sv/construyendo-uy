import type { CSSProperties } from 'react'

export const customIconNames = ['arrow', 'arrow-down', 'check', 'chevron-left', 'chevron-right', 'close', 'copy', 'download', 'expand', 'location', 'money', 'phone', 'ruler', 'transfer', 'visit', 'key', 'play', 'pause', 'grid', 'slides', 'tile', 'bath', 'pool', 'stone', 'stairs', 'facade', 'message', 'estimate', 'level', 'joint', 'cut'] as const
export type IconName = typeof customIconNames[number] | 'whatsapp'

export function Icon({ name, size = 22, className = '', style }: { name: IconName; size?: number; className?: string; style?: CSSProperties }) {
  // WhatsApp: Bootstrap Icons, licencia MIT. Se preserva el trazado de marca.
  if (name === 'whatsapp') return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" stroke="none" aria-hidden="true" className={`whatsapp-brand-icon ${className}`} style={style}><path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" /></svg>
  // Familia ConstruYENDO: planos desfasados, encuentros abiertos y pequeñas cuñas.
  // Los trazados se dibujan aquí; no proceden de una biblioteca de iconos.
  const paths: Record<Exclude<IconName, 'whatsapp'>, React.ReactNode> = {
    arrow: <><path d="M3 12h16m-6-6 6 6-6 6" /><path d="M3 8v8" strokeOpacity=".35" /></>,
    'arrow-down': <><path d="M12 3v16m-6-6 6 6 6-6" /><path d="M8 3h8" strokeOpacity=".35" /></>,
    'chevron-left': <><path d="m15 5-7 7 7 7" /><path d="M4 9v6" strokeOpacity=".35" /></>,
    'chevron-right': <><path d="m9 5 7 7-7 7" /><path d="M20 9v6" strokeOpacity=".35" /></>,
    check: <><path d="m5 12 4 4L19 6" /><path d="M4 18h7l9-9" strokeOpacity=".3" /></>,
    close: <><path d="m6 6 12 12M6 18 18 6" /><path d="M3 6V3h3m15 15v3h-3" strokeOpacity=".35" /></>,
    play: <><path d="m8 4 12 8-12 8Z" fill="currentColor" fillOpacity=".12" /><path d="M4 7v10" strokeOpacity=".35" /></>,
    pause: <><path d="M7 4v16m10-16v16" strokeWidth="2.2" /><path d="M5 4h4m6 16h4" strokeOpacity=".4" /></>,
    grid: <><path d="M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z" /><path className="icon-plane" d="M14 14h7v7h-7Z" /><path className="icon-accent" d="M12 3v3m0 12v3M3 12h3m12 0h3" /></>,
    slides: <><path d="M6 3h12v18H6Z" /><path className="icon-plane" d="M6 3h12v18H6Z" /><path d="M2 6v12m20-12v12" /><path className="icon-accent" d="m10 9 4 3-4 3" /></>,
    copy: <><path d="M8 7h9l4 4v10H8Z" /><path d="M17 7v4h4M16 3H3v14" /><path className="icon-accent" d="M11 14h7m-7 3h5" /></>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" /><path className="icon-accent" d="M4 18h4m8 0h4" /></>,
    expand: <><path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6" /><path d="m9 15 6-6m-4 0h4v4" strokeOpacity=".45" /></>,
    location: <><path d="m12 22-6.1-8.2A7.6 7.6 0 1 1 18.1 13.8Z" /><path className="icon-plane" d="m12 6 3 3-3 3-3-3Z" /><path className="icon-accent" d="m12 6 3 3-3 3-3-3Z" /><path d="M7 22h10" strokeOpacity=".35" /></>,
    money: <><path d="M2 6h20v13H2Zm3-3h14M2 10h3V6m14 13v-4h3" /><path className="icon-accent" d="m12 9 3 3-3 4-3-4Z" /><path d="M5 15h1m12-5h1" /></>,
    phone: <><path d="m4 3 5 1 1 5-3 2a16 16 0 0 0 6 6l2-3 5 1 1 5c-1 2-4 2-7 1A21 21 0 0 1 3 10C2 7 2 4 4 3Z" /><path className="icon-accent" d="M15 3h6v6m-6-6 6 6" /></>,
    ruler: <><path d="m2 17 15-15 5 5L7 22ZM6 13l3 3m1-7 3 3m1-7 3 3" /><path className="icon-accent" d="m3 8 5-5m-5 0h5v5" /></>,
    transfer: <><path d="M3 7h17m-4-4 4 4-4 4M21 17H4m4-4-4 4 4 4" /><path className="icon-accent" d="M3 4v6m18 4v6" /></>,
    visit: <><path d="m3 10 9-7 9 7M5 9v11h14V9M9 20v-6h6v6" /><path className="icon-plane" d="M9 14h6v6H9Z" /><path className="icon-accent" d="m3 20 9 3 9-3m-5-15 3-3 3 3-3 3" /></>,
    key: <><path d="m7 2 5 3v6l-5 3-5-3V5Zm4 10 10 9m-5-5 3-3m-1 5 3-3" /><path className="icon-accent" d="m7 6 2 2-2 2-2-2Z" /></>,
    tile: <><path d="m2 10 10-6 10 6-10 6Zm0 4 10 6 10-6" /><path className="icon-plane" d="m12 4 10 6-10 6Z" /><path d="m7 7 10 6m-10 0L17 7" /><path className="icon-accent" d="M12 1v3m0 16v3" /></>,
    bath: <><path d="M3 12h18l-2 7H5Zm3 7-1 3m13-3 1 3M5 12V5a2 2 0 0 1 4 0v2h3M8 7h4" /><path className="icon-accent" d="M10 9v1m3-1v1M16 3h5v6h-5Z" /><path className="icon-plane" d="M3 12h18l-2 7H5Z" /></>,
    pool: <><path d="M6 12V5a2 2 0 0 1 4 0m4 7V5a2 2 0 0 1 4 0M6 7h8m-8 4h8M2 15l5 2 5-2 5 2 5-2m-20 5 5 2 5-2 5 2 5-2" /><path className="icon-accent" d="M6 7h8" /></>,
    stone: <><path d="M3 3h18v18H3Zm0 6h18M3 15h18M9 3v6m6 0v6m-7 0v6" /><path className="icon-plane" d="M3 9h12v6H3Z" /><path className="icon-accent" d="M1 12h4m14 6h4" /></>,
    stairs: <><path d="M3 20v-5h6v-5h6V5h6v15Zm6-5v5m6-10v10" /><path className="icon-plane" d="M3 15h6v5H3Zm12-5h6v5h-6Z" /><path className="icon-accent" d="m3 9 6-6M4 3h5v5" /></>,
    facade: <><path d="m4 6 8-4 8 4v15H4Zm8-4v19M4 11h16M4 16h16" /><path className="icon-plane" d="m12 2 8 4v15h-8Z" /><path className="icon-accent" d="M2 21h20M8 7v1m8-1v1" /></>,
    message: <><path d="M3 3h18v14H9l-6 5Zm4 5h10M7 12h6" /><path className="icon-plane" d="M16 12h2v2h-2Z" /><path className="icon-accent" d="M16 12h2v2h-2Z" /></>,
    estimate: <><path d="M8 4H4v18h16V4h-4M8 2h8v5H8ZM8 11h8m-8 4h3m-3 3h3" /><path className="icon-accent" d="m14 17 2 2 3-4" /><path className="icon-plane" d="M8 2h8v5H8Z" /></>,
    level: <><path d="M2 8h20v9H2Zm0 3h3m14 0h3M7 22h10" /><path className="icon-accent" d="M9 8V5h6v3m-3-6v3m0 6v3" /><path className="icon-plane" d="M8 8h8v9H8Z" /><path d="M8 8v9m8-9v9" /></>,
    joint: <><path d="M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z" /><path className="icon-accent" d="M12 7v10M7 12h10" strokeWidth="2" /><path className="icon-plane" d="M3 3h7v7H3Zm11 11h7v7h-7Z" /></>,
    cut: <><path d="M3 4h17v17H3Zm0 13L16 4M7 21 20 8" /><path className="icon-accent" d="m9 12 3 3m-1-4 3 3" /><path className="icon-plane" d="M3 4h13L3 17Z" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`constru-icon constru-icon--${name} ${className}`} data-icon={name} style={style}>{paths[name]}</svg>
}

export function TileMark({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 64 66" fill="none" aria-hidden="true" className={className}><g stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="m7 42 1-29L25 3l1 30Z" fill="currentColor" fillOpacity=".15" /><path d="m20 49 1-29L38 10l1 30Z" fill="currentColor" fillOpacity=".35" /><path d="m33 56 1-29L51 17l1 30Z" fill="currentColor" fillOpacity=".07" /><path d="m9 50 18-10 27 15-18 10Z" /><path d="m18 45 27 15M22 57l18-10" /></g></svg>
}

export function Brand({ light = false }: { light?: boolean }) {
  return <span className={`brand ${light ? 'brand--light' : ''}`}><TileMark className="brand-symbol" /><span className="brand-type"><span className="brand-name">CONSTRU<span>YENDO</span></span><span className="brand-subtitle">REVESTIMIENTOS</span></span></span>
}
