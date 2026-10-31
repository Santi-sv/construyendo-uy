import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminApp from './AdminApp'
import { cmsOrigin } from '../lib/managedContent'
import '../brand.css'
import './admin.css'
if (!import.meta.env.DEV && cmsOrigin && location.origin !== new URL(cmsOrigin).origin) location.replace(`${cmsOrigin}/admin`)
else ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><AdminApp /></React.StrictMode>)
