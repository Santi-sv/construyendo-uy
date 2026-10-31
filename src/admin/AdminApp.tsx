import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Brand, Icon } from '../components/Icons'
import type { AdminContent, ManagedImage, ManagedLocation, ManagedPhoto } from '../lib/managedContent'
import { AdminError, adminRequest, prepareUpload } from './api'
import { categoryNames, PhotoEditor } from './PhotoEditor'
import type { ImageEdit } from './PhotoEditor'
type Session = { csrf: string; expiresAt: number }
type Tab = 'gallery' | 'hero' | 'locations' | 'settings'
const draftData = (content: AdminContent) => ({ photos: content.photos.map(({ id, category, description, mediaId, visible }) => ({ id, category, description, mediaId, visible })), locations: content.locations.map(({ id, caption, mediaId }) => ({ id, caption, mediaId })), hero: { mediaId: content.hero.mediaId, kind: content.hero.kind, alt: content.hero.alt } })
const dateLabel = (date: string | null) => date ? new Intl.DateTimeFormat('es-UY', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(date)) : 'Todavía no hay publicaciones desde el panel'
const publicSite = import.meta.env.VITE_PUBLIC_SITE_URL || (import.meta.env.DEV ? '/' : 'https://santi-sv.github.io/construyendo-uy/')

function Shield({ size = 24 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m12 2 8 3v6c0 5-4 8-8 11-4-3-8-6-8-11V5Z" /><path d="m8 12 3 3 5-6" /></svg> }
export default function AdminApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [content, setContent] = useState<AdminContent | null>(null)
  const [baseline, setBaseline] = useState('')
  const [tab, setTab] = useState<Tab>('gallery')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState<ManagedPhoto | 'new' | 'hero' | { location: ManagedLocation } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [currentCode, setCurrentCode] = useState('')
  const [newCode, setNewCode] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const dirty = !!content && JSON.stringify(draftData(content)) !== baseline
  const accept = (value: AdminContent) => { setContent(value); setBaseline(JSON.stringify(draftData(value))) }
  const failure = (value: unknown) => {
    const message = value instanceof Error ? value.message : 'No pudimos completar la operación.'
    setError(message); setNotice('')
    if (value instanceof AdminError && value.status === 401 && message.startsWith('Ingresá')) setSession(null)
  }
  useEffect(() => {
    let active = true
    adminRequest<Session>('session').then(async value => { const data = await adminRequest<AdminContent>('content'); if (active) { setSession(value); accept(data) } }).catch(value => { if (active && !(value instanceof AdminError && value.status === 401)) failure(value) }).finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  const shownPhotos = useMemo(() => content?.photos.filter(photo => (filter === 'auxiliary' ? photo.auxiliary || photo.detailOf : !photo.auxiliary && !photo.detailOf && (filter === 'all' || photo.category === filter)) && photo.description.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))) || [], [content, filter, search])

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try { const value = await adminRequest<Session>('login', undefined, { code }); setCode(''); const data = await adminRequest<AdminContent>('content'); setSession(value); accept(data) } catch (value) { failure(value) } finally { setBusy(false) }
  }
  async function save(): Promise<AdminContent> {
    if (!session || !content) throw new Error('Ingresá para continuar.')
    const value = await adminRequest<AdminContent>('content', session.csrf, { ...draftData(content), revision: content.revision }, 'PUT')
    accept(value); return value
  }
  async function persist(publish: boolean) {
    setBusy(true); setError(''); setNotice('')
    try {
      let value = dirty ? await save() : content!
      if (publish) { value = await adminRequest<AdminContent>('publish', session!.csrf, { revision: value.revision }); accept(value) }
      setNotice(publish ? 'Cambios publicados. Ya se pueden ver al abrir la web.' : 'Borrador guardado. Los cambios todavía no se muestran en la web.')
    } catch (value) { failure(value) } finally { setBusy(false) }
  }
  async function editImage(edit: ImageEdit) {
    if (!content || !session) throw new Error('Ingresá para continuar.')
    let uploaded: { id: string; image: ManagedImage } | null = null
    if (edit.file) uploaded = await adminRequest('media', session.csrf, await prepareUpload(edit.file))
    setContent(previous => {
      if (!previous) return previous
      if (editor === 'hero') {
        const image = uploaded ? { desktop: { small: { src: uploaded.image.small, width: uploaded.image.smallWidth || Math.min(640, uploaded.image.width), height: uploaded.image.smallHeight || Math.round(uploaded.image.height * Math.min(640, uploaded.image.width) / uploaded.image.width) }, large: { src: uploaded.image.large, width: uploaded.image.width, height: uploaded.image.height } }, mobile: { small: { src: uploaded.image.small, width: uploaded.image.smallWidth || Math.min(640, uploaded.image.width), height: uploaded.image.smallHeight || Math.round(uploaded.image.height * Math.min(640, uploaded.image.width) / uploaded.image.width) }, large: { src: uploaded.image.large, width: uploaded.image.width, height: uploaded.image.height } } } : previous.hero.image
        return { ...previous, hero: { mediaId: uploaded?.id || previous.hero.mediaId, kind: edit.kind, alt: edit.description, image } }
      }
      if (typeof editor === 'object' && editor && 'location' in editor) return { ...previous, locations: previous.locations.map(place => place.id === editor.location.id ? { ...place, caption: edit.description, mediaId: uploaded?.id || place.mediaId, image: uploaded?.image || place.image, ...(uploaded ? { source: undefined, license: undefined, licenseUrl: undefined } : {}) } : place) }
      const existing = typeof editor === 'object' ? editor : null
      const photo: ManagedPhoto = { ...(existing || {}), id: existing?.id || `foto-${crypto.randomUUID()}`, category: edit.category, description: edit.description, visible: existing?.detailOf || existing?.auxiliary ? false : edit.visible, mediaId: uploaded?.id || existing?.mediaId || null, image: uploaded?.image || existing!.image }
      return { ...previous, photos: existing ? previous.photos.map(item => item.id === existing.id ? photo : item) : [photo, ...previous.photos] }
    })
    setEditor(null); setNotice('Imagen aplicada al borrador. Guardá o publicá cuando esté todo listo.'); setError('')
  }
  function move(id: string, delta: number) {
    setContent(previous => {
      if (!previous) return previous
      const positions = previous.photos.map((photo, index) => !photo.detailOf && !photo.auxiliary ? index : -1).filter(index => index >= 0)
      const from = previous.photos.findIndex(photo => photo.id === id); const position = positions.indexOf(from); const to = positions[position + delta]
      if (to === undefined) return previous
      const photos = [...previous.photos]; [photos[from], photos[to]] = [photos[to], photos[from]]
      return { ...previous, photos }
    })
  }
  async function changeCode(event: FormEvent) {
    event.preventDefault(); setError(''); setNotice('')
    if (newCode !== confirmCode) { setError('Los códigos nuevos no coinciden.'); return }
    setBusy(true)
    try { const next = await adminRequest<Session>('code', session!.csrf, { currentCode, newCode }); setSession(next); setCurrentCode(''); setNewCode(''); setConfirmCode(''); setNotice('Código actualizado. Las otras sesiones se cerraron; deberán ingresar con el nuevo código.') } catch (value) { failure(value) } finally { setBusy(false) }
  }
  async function logout() {
    if (dirty && !window.confirm('Hay cambios sin guardar. ¿Querés salir y descartarlos?')) return
    setBusy(true)
    try { await adminRequest('logout', session!.csrf, {}); setSession(null); setContent(null); setNotice(''); setError('') } catch (value) { failure(value) } finally { setBusy(false) }
  }
  if (checking) return <div className="cms-loading" role="status"><Brand light /><span>Preparando el panel…</span></div>
  if (!session) return <main className="cms-login">
    <section className="cms-login-story"><Brand light /><div><span className="cms-kicker">ESPACIO DEL EQUIPO</span><h1>El próximo<br />trabajo empieza<br /><em>con una imagen.</em></h1><p>Las fotos de tus obras, siempre al día.</p></div><span className="cms-story-note"><Shield size={19} />Administración de ConstruYENDO</span></section>
    <section className="cms-login-form"><a className="cms-back-link" href={publicSite}><Icon name="chevron-left" size={16} />Volver a la web</a><form onSubmit={login}><span className="cms-login-shield"><Shield size={28} /></span><span className="cms-kicker">ACCESO PRIVADO</span><h2>Tu panel de imágenes.</h2><p>Ingresá con el código compartido del equipo.</p><label className="cms-field">Código de acceso<span className="cms-password"><input type={showCode ? 'text' : 'password'} autoComplete="current-password" value={code} onChange={event => setCode(event.target.value)} minLength={14} maxLength={128} required autoFocus disabled={busy} /><button type="button" onClick={() => setShowCode(value => !value)} aria-pressed={showCode}>{showCode ? 'Ocultar' : 'Mostrar'}</button></span></label>{error && <p role="alert" className="cms-alert cms-alert--error">{error}</p>}<button className="cms-button cms-button--gold cms-login-submit" type="submit" disabled={busy}>{busy ? 'Verificando…' : 'Entrar al panel'}<Icon name="arrow" size={20} /></button><span className="cms-login-footnote"><Shield size={15} />Solo para el equipo de ConstruYENDO.</span></form></section>
  </main>

  return <div className="cms-app">
    <header className="cms-header"><Brand light /><span className="cms-header-label"><Shield size={16} />ADMINISTRACIÓN</span><a href={publicSite} target="_blank" rel="noopener noreferrer" className="cms-header-site">Ver sitio<Icon name="expand" size={16} /></a><button type="button" className="cms-header-exit" onClick={logout} disabled={busy}>Salir<Icon name="arrow" size={16} /></button></header>
    <div className="cms-workspace">
      <aside className="cms-sidebar"><span className="cms-kicker">TU SITIO</span><nav aria-label="Administración de imágenes">{([{ id: 'gallery', icon: 'grid', title: 'Galería de trabajos' }, { id: 'hero', icon: 'slides', title: 'Imagen de portada' }, { id: 'locations', icon: 'location', title: 'Localidades' }, { id: 'settings', icon: 'key', title: 'Configuración' }] as const).map(item => <button type="button" key={item.id} aria-current={tab === item.id ? 'page' : undefined} onClick={() => { setTab(item.id); setError(''); setNotice('') }}><Icon name={item.icon} size={20} /><span>{item.title}</span>{item.id === tab && <Icon name="chevron-right" size={15} />}</button>)}</nav><div className="cms-sidebar-note"><Shield size={20} /><strong>Un acceso para el equipo</strong><p>Podés cambiar el código en Configuración.</p></div></aside>
      <main className="cms-main">
        <div className="cms-topbar"><div><span className={`cms-state ${dirty || content?.hasUnpublishedChanges ? 'cms-state--draft' : ''}`}><span />{dirty ? 'Cambios sin guardar' : content?.hasUnpublishedChanges ? 'Borrador guardado' : 'Todo al día'}</span><small>{content?.publishedAt ? `Última publicación: ${dateLabel(content.publishedAt)}` : 'Revisá los cambios antes de publicar.'}</small></div><div className="cms-save-actions"><button type="button" className="cms-button cms-button--outline" disabled={!content || busy || !dirty} onClick={() => persist(false)}><Icon name="estimate" size={17} />Guardar borrador</button><button type="button" className="cms-button cms-button--gold" disabled={!content || busy || (!dirty && !content.hasUnpublishedChanges)} onClick={() => persist(true)}>{busy ? 'Guardando…' : 'Publicar cambios'}<Icon name="arrow" size={17} /></button></div></div>
        {error && <div role="alert" className="cms-alert cms-alert--error">{error}{error.includes('Recarg') && <button type="button" onClick={async () => { if (dirty && !window.confirm('Al recargar se descartan los cambios que no guardaste. ¿Continuar?')) return; try { accept(await adminRequest<AdminContent>('content')); setError('') } catch (value) { failure(value) } }}>Recargar datos</button>}</div>}{notice && <p role="status" className="cms-alert cms-alert--success"><Icon name="check" size={18} />{notice}</p>}
        {tab === 'gallery' && content && <><div className="cms-page-heading"><div><span className="cms-kicker">GALERÍA DE TRABAJOS</span><h1>Tu trabajo, en imágenes.</h1><p>Agregá fotos, actualizá sus datos y elegí cuáles mostrar.</p></div><button type="button" className="cms-button cms-button--dark" onClick={() => setEditor('new')} disabled={busy || content.photos.length >= 200}><span className="cms-plus">+</span>Agregar foto</button></div><div className="cms-gallery-tools"><label className="cms-search"><Icon name="grid" size={17} /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por descripción" aria-label="Buscar fotos" /></label><span>{shownPhotos.length} {shownPhotos.length === 1 ? 'foto' : 'fotos'}</span></div><div className="cms-filters" role="group" aria-label="Filtrar imágenes">{[['all', 'Todas'], ...Object.entries(categoryNames), ['auxiliary', 'Otras secciones']].map(([id, name]) => <button type="button" key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>{name}</button>)}</div><div className="cms-photo-grid">{shownPhotos.map(photo => <article className="cms-photo-card" key={photo.id}><button className="cms-photo-open" type="button" onClick={() => setEditor(photo)} aria-label={`Editar: ${photo.description}`} disabled={busy}><img src={photo.image.small} alt={photo.description} loading="lazy" width={photo.image.width} height={photo.image.height} /><span className={`cms-photo-state ${!photo.visible ? 'is-hidden' : ''}`}>{photo.auxiliary || photo.detailOf ? 'Otra sección' : photo.visible ? 'Visible' : 'Oculta'}</span><span className="cms-photo-edit"><Icon name="estimate" size={15} />Editar foto</span></button><div className="cms-photo-details"><span>{categoryNames[photo.category]}</span><h2>{photo.description}</h2><div className="cms-photo-bottom"><button type="button" onClick={() => setEditor(photo)} disabled={busy}>Editar<Icon name="arrow" size={15} /></button>{!photo.auxiliary && !photo.detailOf && <span className="cms-reorder"><button type="button" onClick={() => move(photo.id, -1)} disabled={busy || content.photos.filter(p => !p.auxiliary && !p.detailOf)[0]?.id === photo.id} aria-label={`Mover antes: ${photo.description}`}><Icon name="chevron-left" size={17} /></button><button type="button" onClick={() => move(photo.id, 1)} disabled={busy || content.photos.filter(p => !p.auxiliary && !p.detailOf).at(-1)?.id === photo.id} aria-label={`Mover después: ${photo.description}`}><Icon name="chevron-right" size={17} /></button></span>}</div></div></article>)}</div>{shownPhotos.length === 0 && <p className="cms-empty">No hay fotos que coincidan con esta búsqueda.</p>}</>}
        {tab === 'hero' && content && <><div className="cms-page-heading"><div><span className="cms-kicker">PRIMERA IMPRESIÓN</span><h1>La imagen de portada.</h1><p>Elegí la foto que presenta a ConstruYENDO.</p></div><button type="button" className="cms-button cms-button--dark" onClick={() => setEditor('hero')} disabled={busy}>Editar portada<Icon name="arrow" size={18} /></button></div><section className="cms-hero-preview"><img src={content.hero.image.desktop.large.src} alt={content.hero.alt} /><span>{content.hero.kind === 'illustrative' ? 'Imagen ilustrativa' : 'Obra real'}</span><div><span>CONSTRUYENDO REVESTIMIENTOS</span><h2>Revestimientos<br /><em>a tu medida.</em></h2></div></section><div className="cms-hero-description"><Icon name="message" size={22} /><div><strong>Descripción de la imagen</strong><p>{content.hero.alt}</p></div></div></>}
        {tab === 'locations' && content && <><div className="cms-page-heading"><div><span className="cms-kicker">IMÁGENES DE UBICACIÓN</span><h1>Cada lugar, su imagen.</h1><p>Elegí las fotos que representan a las siete localidades en el pedido.</p></div></div><div className="cms-photo-grid cms-location-grid">{content.locations.map(place => <article className="cms-photo-card" key={place.id}><button className="cms-photo-open" type="button" onClick={() => setEditor({ location: place })} aria-label={`Editar imagen de ${place.label}`}><img src={place.image.small} alt={place.label} loading="lazy" /><span className="cms-photo-edit"><Icon name="location" size={15} />Cambiar imagen</span></button><div className="cms-photo-details"><span>LOCALIDAD</span><h2>{place.label}</h2>{place.caption && <p>{place.caption}</p>}<div className="cms-photo-bottom"><button type="button" onClick={() => setEditor({ location: place })}>Editar imagen<Icon name="arrow" size={15} /></button></div></div></article>)}</div></>}
        {tab === 'settings' && <><div className="cms-page-heading"><div><span className="cms-kicker">CONFIGURACIÓN</span><h1>El acceso, en tus manos.</h1><p>Administrá el código compartido del equipo.</p></div></div><div className="cms-settings-layout"><form className="cms-settings-card" onSubmit={changeCode}><span className="cms-settings-icon"><Shield size={26} /></span><h2>Cambiar código de acceso</h2><p>El nuevo código se aplica a todo el equipo.</p><label className="cms-field">Código actual<input type="password" autoComplete="current-password" value={currentCode} onChange={event => setCurrentCode(event.target.value)} required maxLength={128} disabled={busy} /></label><label className="cms-field">Código nuevo<input type="password" autoComplete="new-password" value={newCode} onChange={event => setNewCode(event.target.value)} required minLength={14} maxLength={128} disabled={busy} /></label><label className="cms-field">Repetir código nuevo<input type="password" autoComplete="new-password" value={confirmCode} onChange={event => setConfirmCode(event.target.value)} required minLength={14} maxLength={128} disabled={busy} /></label><p className="cms-help">Usá al menos 14 caracteres con letras. Una frase de varias palabras es fácil de recordar.</p><button type="submit" className="cms-button cms-button--gold" disabled={busy}>{busy ? 'Actualizando…' : 'Actualizar código'}<Icon name="check" size={18} /></button></form><aside className="cms-settings-note"><Shield size={28} /><h2>Compartilo solo con el equipo.</h2><p>Quien tenga el código podrá administrar las imágenes de la web.</p><p>Cuando lo cambies, las otras sesiones se cerrarán. La sesión también vence después de 30 minutos sin actividad.</p><span>El código nunca se muestra en la web pública.</span></aside></div></>}
      </main>
    </div>
    {editor && <PhotoEditor photo={typeof editor === 'object' && !('location' in editor) ? editor : undefined} location={typeof editor === 'object' && 'location' in editor ? editor.location : undefined} hero={editor === 'hero' ? content?.hero : undefined} onClose={() => setEditor(null)} onSave={editImage} />}
  </div>
}
