// import { defineConfig } from 'vite'
// import vue from '@vitejs/plugin-vue'

// export default defineConfig({
//   plugins: [vue()],
// })

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),

    VitePWA({
      registerType: 'autoUpdate',

      includeAssets: [
        'favicon.ico'
      ],

      manifest: {
        name: 'OCR System',
        short_name: 'OCR',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff'
      },

      workbox: {
        globPatterns: [
          '**/*.{js,css,html,png,svg,ico}'
        ]
      }
    })
  ]
})