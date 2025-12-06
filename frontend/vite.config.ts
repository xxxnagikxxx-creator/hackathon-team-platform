import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/docs': {
        target: 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      '/openapi.json': {
        target: 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
      // Проксирование всех API запросов
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Проксирование других API эндпоинтов
      '/login-by-code': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/profile': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/hackathons': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
      '/teams': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
})
