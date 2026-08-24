import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Enregistrement immédiat du Service Worker (Gestion Hors-ligne & PWA)
registerSW({ immediate: true })

// Rendu de l'application React dans le DOM
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)