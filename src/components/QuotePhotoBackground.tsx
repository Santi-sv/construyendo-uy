import { useState } from 'react'
import type { QuotePhoto } from '../lib/quoteVisuals'

/** Fotos decorativas; las etiquetas de la tarjeta mantienen toda la información. */
export function QuotePhotoBackground({ photo }: { photo: QuotePhoto }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return <span className="brief-field-media" aria-hidden="true">
    {!failed && <img src={photo.src} alt="" loading="lazy" decoding="async" style={{ objectPosition: photo.position }} className={loaded ? 'is-loaded' : ''} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
  </span>
}
