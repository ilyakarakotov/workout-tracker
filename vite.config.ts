/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/workout-tracker/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Forge — PPL Workout Tracker',
        short_name: 'Forge',
        description: 'Push / Pull / Legs, twice a week. Log lifts, chase PRs, keep the streak.',
        theme_color: '#0B0C0F',
        background_color: '#0B0C0F',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/workout-tracker/',
        scope: '/workout-tracker/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,gif,woff2}'],
        navigateFallback: '/workout-tracker/index.html'
      }
    })
  ],
  test: {
    environment: 'jsdom',
    globals: false
  }
})
