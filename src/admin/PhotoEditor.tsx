import { useEffect, useRef, useState } from 'react'
import type { ManagedHero, ManagedLocation, ManagedPhoto, PhotoCategory } from '../lib/managedContent'
import { Icon } from '../components/Icons'
export const categoryNames: Record<PhotoCategory, string> = { banos: 'Baños', pisos: 'Pisos', piscinas: 'Piscinas', piedra: 'Piedra librillo', escaleras: 'Escaleras' }
export type ImageEdit = { file: File | null; description: string; category: PhotoCategory; visible: boolean; kind: 'real' | 'illustrative' }
export function PhotoEditor({ photo, hero, location, onClose, onSave }: { photo?: ManagedPhoto; hero?: ManagedHero; location?: ManagedLocation; onClose: () => void; onSave: (edit: ImageEdit) => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(photo?.image.large || hero?.image.desktop.large.src || location?.image.large || '')
  const [description, setDescription] = useState(photo?.description || hero?.alt || location?.caption || '')
  const [category, setCategory] = useState<PhotoCategory>(photo?.category || 'pisos')
  const [kind, setKind] = useState<'real' | 'illustrative'>(hero?.kind || 'real')
  const [visible, setVisible] = useState(photo?.visible ?? true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { dialog.current?.showModal() }, [])
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file); setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return <dialog className="cms-dialog" ref={dialog} onCancel={event => { if (pending) event.preventDefault(); else onClose() }} onClose={onClose} aria-labelledby="image-edit-title">
    <form onSubmit={async event => { event.preventDefault(); if (!file && !photo && !hero && !location) { setError('Elegí una imagen para continuar.'); return } setPending(true); setError(''); try { await onSave({ file, description, category, visible, kind }) } catch (failure) { setError(failure instanceof Error ? failure.message : 'No pudimos guardar la imagen.'); setPending(false) } }}>
      <div className="cms-dialog-head"><div><span className="cms-kicker">{location ? location.label.toUpperCase() : hero ? 'PORTADA' : 'FOTOGRAFÍA'}</span><h2 id="image-edit-title">{location ? 'Imagen de la localidad' : hero ? 'Editar portada' : photo ? 'Editar foto' : 'Agregar foto'}</h2></div><button className="cms-icon-button" type="button" onClick={onClose} disabled={pending} aria-label="Cerrar editor"><Icon name="close" /></button></div>
      <div className="cms-editor-preview">{preview ? <img src={preview} alt="Vista previa de la imagen elegida" /> : <div><Icon name="grid" size={40} /><p>Elegí una foto de tu trabajo</p></div>}</div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => { setFile(event.target.files?.[0] || null); setError('') }} />
      <button type="button" className="cms-button cms-button--outline cms-file-button" disabled={pending} onClick={() => input.current?.click()}><Icon name="download" size={17} />{preview ? 'Elegir otra imagen' : 'Elegir imagen'}</button>
      <p className="cms-help">JPG, PNG o WebP · Hasta 25 MB. El archivo original no se modifica.</p>
      <label className="cms-field">{location ? 'Aclaración de la foto (opcional)' : hero ? 'Descripción de la portada' : 'Descripción del trabajo'}<textarea value={description} onChange={event => setDescription(event.target.value)} required={!location} maxLength={location ? 80 : hero ? 240 : 180} rows={2} placeholder="Por ejemplo: Piso de porcelanato símil mármol" disabled={pending} /></label>
      {location ? <p className="cms-help">Elegí una foto que represente a {location.label}. Las condiciones de visita se conservan.</p> : hero ? <label className="cms-field">Tipo de imagen<select value={kind} onChange={event => setKind(event.target.value as typeof kind)} disabled={pending}><option value="real">Foto de una obra real</option><option value="illustrative">Imagen ilustrativa</option></select></label> : <><label className="cms-field">Categoría<select value={category} onChange={event => setCategory(event.target.value as PhotoCategory)} disabled={pending}>{Object.entries(categoryNames).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>{!photo?.auxiliary && !photo?.detailOf && <label className="cms-checkbox"><input type="checkbox" checked={visible} onChange={event => setVisible(event.target.checked)} disabled={pending} />Mostrar en la galería</label>}<p className="cms-help">La galería muestra únicamente fotos de obras reales de ConstruYENDO.</p></>}
      {error && <p role="alert" className="cms-alert cms-alert--error">{error}</p>}
      <div className="cms-dialog-actions"><button type="button" className="cms-button cms-button--ghost" onClick={onClose} disabled={pending}>Cancelar</button><button type="submit" className="cms-button cms-button--gold" disabled={pending}>{pending ? 'Preparando imagen…' : 'Aplicar al borrador'}<Icon name="check" size={17} /></button></div>
    </form>
  </dialog>
}
