import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminApp from './AdminApp'
import { Brand } from '../components/Icons'
import '../brand.css'
import './admin.css'
const secure = import.meta.env.DEV || location.protocol === 'https:'
const secureUrl = new URL(location.href); secureUrl.protocol = 'https:'
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{secure ? <AdminApp /> : <main className="cms-loading"><Brand light /><h1>Conexión segura necesaria.</h1><p>Para ingresar al panel, abrilo mediante HTTPS.</p><a className="cms-button cms-button--gold" href={secureUrl.href}>Abrir panel seguro</a></main>}</React.StrictMode>)
