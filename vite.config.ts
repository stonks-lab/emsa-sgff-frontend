import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// El SGFF se publica en el IIS del servidor bajo /sgff/, junto a otras apps (cada una en /<app>).
// En desarrollo la app queda en http://localhost:5173/sgff/ y el proxy le quita el prefijo a la API.
const BASE = '/sgff/'

export default defineConfig({
  base: BASE,
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      [`${BASE}api`]: {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.slice(BASE.length - 1),   // /sgff/api/x → /api/x
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.error('[vite-proxy] error →', req.url, err.message)
          })
        },
      },
    },
  },
})
