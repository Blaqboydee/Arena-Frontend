import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Retire the previously-shipped service worker: this emits a SW that
      // unregisters the old one and clears its caches on every device. The app
      // is network-required (multiplayer), so offline caching only caused stale
      // builds. Installability is preserved via the manifest below.
      selfDestroying: true,
      // Registered manually in main.tsx — web only, never inside the Capacitor app.
      injectRegister: false,
      includeAssets: ['favicon.png', 'favicon-32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Arena — 1v1 Multiplayer Games',
        short_name: 'Arena',
        description:
          'Real-time 1v1 multiplayer games. Create a private room, send the invite link, and battle your friends. No signup, no mercy.',
        theme_color: '#080809',
        background_color: '#080809',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell only. Icons are fetched on demand at install time,
        // so keep them out of the first-load precache.
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Never let the SW serve the SPA shell for API / socket traffic.
        navigateFallbackDenylist: [/^\/api/, /socket\.io/],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
      '/api': {
        target: 'http://localhost:3000',
      },
    },
  },
})
