import { categories, projects } from '../lib/gallery'
import type { Category } from '../lib/gallery'
import { Icon } from './Icons'
import type { IconName } from './Icons'

export type GalleryMode = 'slides' | 'grid'
const categoryIcons: Record<Category, IconName> = { todos: 'grid', banos: 'bath', pisos: 'tile', piscinas: 'pool', piedra: 'stone', escaleras: 'stairs' }
const categoryCounts = Object.fromEntries(categories.map(({ id }) => [id, projects.filter((photo) => id === 'todos' || photo.category === id).length]))

export function PortfolioExplorer({ category, mode, onCategoryChange, onModeChange }: {
  category: Category
  mode: GalleryMode
  onCategoryChange: (category: Category) => void
  onModeChange: (mode: GalleryMode) => void
}) {
  const selectedLabel = categories.find((item) => item.id === category)?.label
  const count = categoryCounts[category]

  return <>
    <div className="portfolio-explorer" data-reveal="up">
      <div className="portfolio-explorer-heading"><div><span className="eyebrow">EXPLORÁ POR CATEGORÍA</span><h3>Elegí qué querés ver<span>.</span></h3></div><p>Encontrá ideas<br />para tu próxima obra.</p></div>
      <div className="portfolio-categories" role="group" aria-label="Filtrar trabajos por categoría">
        {categories.map((item) => {
          const selected = category === item.id
          const total = categoryCounts[item.id]
          return <button key={item.id} type="button" className={`category-card ${selected ? 'is-active' : ''}`} aria-label={`${item.label}, ${total} ${total === 1 ? 'foto' : 'fotos'}`} aria-pressed={selected} aria-controls="portfolio-results" onClick={() => onCategoryChange(item.id)}>
            <span className="category-card-head"><Icon name={categoryIcons[item.id]} size={37} /><span className="category-card-count">{String(total).padStart(2, '0')}<small>{total === 1 ? 'FOTO' : 'FOTOS'}</small></span></span>
            <span className="category-card-title">{item.id === 'todos' ? 'Ver todos' : item.label}</span>
            <span className="category-card-terminal"><Icon name={selected ? 'check' : 'arrow'} size={18} /></span>
          </button>
        })}
      </div>
    </div>
    <div className="portfolio-results-toolbar">
      <div className="portfolio-selection" role="status" aria-live="polite" aria-atomic="true"><span className="portfolio-selection-label">ESTÁS VIENDO</span><strong>{selectedLabel}</strong><span className="portfolio-selection-count">{String(count).padStart(2, '0')} {count === 1 ? 'foto' : 'fotos'}</span></div>
      <div className="gallery-view-switch" role="group" aria-label="Presentación de los trabajos"><button type="button" aria-pressed={mode === 'slides'} onClick={() => onModeChange('slides')} aria-controls="portfolio-results" aria-label="Ver como carrusel"><Icon name="slides" size={18} /><span>Recorrer</span></button><button type="button" aria-pressed={mode === 'grid'} onClick={() => onModeChange('grid')} aria-controls="portfolio-results" aria-label="Ver como grilla"><Icon name="grid" size={18} /><span>Grilla</span></button></div>
    </div>
  </>
}
