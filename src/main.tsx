import React from 'react'
import ReactDOM from 'react-dom/client'
import { loadManagedContent } from './lib/managedContent'
import { applyManagedContent } from './lib/gallery'
import './styles.css'
import './brand.css'
import './motion.css'
import './coverage.css'
import './quote.css'
import './hero-scene.css'
import './quote-preview.css'
import './button-effects.css'
import './iconography.css'
import './next-buttons.css'
import './gradient-buttons.css'
import './contact-options.css'
import './portfolio-explorer.css'
import './payment-panel.css'
import './contact-morph.css'
import './header.css'
import './action-motion.css'

const content = await loadManagedContent()
if (content) applyManagedContent(content)
const { default: App } = await import('./App')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
