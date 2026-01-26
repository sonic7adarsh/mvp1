import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            try {
              // Drop Origin header to avoid Spring CORS filter rejecting preflight
              // Not all environments support removeHeader; fallback to setting to target
              // @ts-ignore
              if (typeof proxyReq.removeHeader === 'function') {
                // @ts-ignore
                proxyReq.removeHeader('origin')
              } else if (process.env.VITE_PROXY_TARGET) {
                proxyReq.setHeader('origin', process.env.VITE_PROXY_TARGET)
              }
            } catch {}
          })
        },
      },
    },
  },
})
