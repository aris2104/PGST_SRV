import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Enregistrement immédiat du Service Worker (Gestion Hors-ligne & PWA)
registerSW({ immediate: true })

// Demande un stockage "persistant" (non-évictable automatiquement) au
// navigateur. Sans ça, sur certains appareils (notamment Android), le
// navigateur peut décider de vider le stockage local d'une app peu
// utilisée sous pression de stockage — ce qui emporterait aussi les
// jetons de connexion avec lui, forçant une reconnexion inattendue
// (ex: après avoir "swipé" l'app depuis les applications récentes).
// Cet appel ne fait qu'une demande ; le navigateur peut refuser
// silencieusement (pas de garantie absolue), mais ça ne coûte rien et
// réduit nettement le risque.
if (navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {})
}

// Rendu de l'application React dans le DOM
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)