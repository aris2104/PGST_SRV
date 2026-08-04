import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Indispensable pour activer la PWA en mode dev / tunnel
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'PGST - Gestion des Servants',
        short_name: 'PGST',
        description: 'Plateforme de Gestion des Servants',
        theme_color: '#24365A',
        background_color: '#ede6df',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    cors: true,
    //  REDIRECTION DE L'API VERS DJANGO
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})