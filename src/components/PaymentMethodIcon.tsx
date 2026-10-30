/** Ilustraciones SVG propias: billetes y monedas; banco con transferencias. */
export function PaymentMethodIcon({ method }: { method: 'cash' | 'transfer' }) {
  return <svg className={`payment-illustration payment-illustration--${method}`} viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {method === 'cash' ? <>
      <g transform="rotate(-11 30 28)">
        <rect x="9" y="12" width="43" height="28" rx="4" fill="var(--method-depth)" strokeOpacity=".55" />
        <path d="M15 17h30M15 35h30" strokeOpacity=".35" />
      </g>
      <rect x="5" y="22" width="44" height="28" rx="4" fill="var(--method-fill)" />
      <path d="M14 26h25a5 5 0 0 0 6 5v10a5 5 0 0 0-6 5H15a5 5 0 0 0-6-5V31a5 5 0 0 0 5-5Z" strokeOpacity=".45" />
      <ellipse cx="27" cy="36" rx="7" ry="9" fill="var(--method-depth)" />
      <path d="M30 32.5c-1-1.8-6-1.5-6 .8 0 3 6 1.3 6 4.2 0 2.5-4.5 3-6.2 1.1M27 29v14" stroke="var(--method-highlight)" strokeWidth="1.5" />
      <path d="M13 36h2m24 0h2" strokeWidth="2.2" />
      <path d="M43 47v6c0 2 3.8 4 8.5 4s8.5-2 8.5-4v-6" fill="var(--method-depth)" />
      <path d="M43 50c0 2.2 3.8 4 8.5 4s8.5-1.8 8.5-4" strokeOpacity=".6" />
      <ellipse cx="51.5" cy="47" rx="8.5" ry="4" fill="var(--method-fill)" />
      <ellipse cx="49" cy="41.5" rx="8.5" ry="4" fill="var(--method-depth)" />
      <path d="M40.5 41.5v4c0 2.2 3.8 4 8.5 4s8.5-1.8 8.5-4v-4" />
      <path d="M47 41.5h4" stroke="var(--method-highlight)" />
      <path d="M54 12h5m-2.5-2.5v5" strokeOpacity=".6" />
    </> : <>
      <path d="m9 23 23-14 23 14Z" fill="var(--method-fill)" />
      <path d="M13 23h38v5H13Z" fill="var(--method-depth)" />
      <circle cx="32" cy="17.5" r="2.5" fill="var(--method-highlight)" stroke="none" />
      <path d="M17 28h5v16h-5Zm12 0h6v16h-6Zm13 0h5v16h-5Z" fill="var(--method-fill)" />
      <path d="M19.5 31v10M32 31v10m12.5-10v10" stroke="var(--method-highlight)" strokeWidth="1.1" strokeOpacity=".55" />
      <path d="M13 44h38v4H13Z" fill="var(--method-depth)" />
      <path d="M8 48h22" strokeOpacity=".4" />
      <rect x="30" y="37" width="32" height="25" rx="6" fill="var(--method-depth)" strokeOpacity=".55" />
      <path d="M36 45h19m-4-4 4 4-4 4" stroke="var(--method-highlight)" strokeWidth="2.1" />
      <path d="M56 55H37m4-4-4 4 4 4" strokeWidth="2.1" />
      <path d="M6 11h4m-2-2v4" strokeOpacity=".6" />
    </>}
  </svg>
}
