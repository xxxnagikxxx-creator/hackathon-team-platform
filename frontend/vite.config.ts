import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Определяем, где запущен бэкенд
// По умолчанию используем localhost:8000 (бэкенд проброшен на этот порт)
// Если фронтенд запущен в Docker, можно переопределить через переменную окружения API_PROXY_TARGET=http://backend:8000
const backendUrl = process.env.API_PROXY_TARGET || 'http://backend:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        // Не убираем префикс /api, так как бэкенд ожидает его в роутерах
        cookieDomainRewrite: 'localhost',
        secure: false,
        ws: true, // для WebSocket поддержки, если нужно
      },
    },
  },
})



