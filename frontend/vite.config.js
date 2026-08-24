import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest', // Active votre Service Worker sur mesure
      srcDir: 'src',                // Emplacement de votre sw.js source
      filename: 'sw.js',
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,               // Génère dev-dist/sw.js au lancement
        type: 'module',
      },
      includeAssets: ['favicon.ico', 'favicon-96x96.png', 'favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'PGST - Gestion des Servants',
        short_name: 'PGST',
        description: 'Plateforme de Gestion des Servants',
        theme_color: '#24365A',
        background_color: '#24365A',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      }
    }),
  ],
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})