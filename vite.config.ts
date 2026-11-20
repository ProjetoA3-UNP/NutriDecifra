import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // porta fixa: se a 5173 estiver ocupada, o Vite avisa em vez de trocar de porta sozinho
    port: 5173,
    strictPort: true,
    // mesmo redirecionamento que o vercel.json faz em produção
    proxy: {
      '/off-search': {
        target: 'https://search.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/off-search/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'NutriDecifra',
        short_name: 'NutriDecifra',
        description: 'Decifre o que você come: leia o código de barras e entenda o rótulo.',
        lang: 'pt-BR',
        theme_color: '#1f7a4d',
        background_color: '#1f7a4d',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // Nunca guardar em cache respostas do Supabase ou do Open Food Facts:
        // os dados precisam estar sempre atualizados.
        navigateFallbackDenylist: [/^\/auth\//, /^\/off-search\//],
      },
    }),
  ],
})
