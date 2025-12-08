import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Определяем, где запущен бэкенд
// Для разработки можно использовать локальный или реальный сервер
const backendUrl = process.env.API_PROXY_TARGET || 'http://89.169.160.161'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        // Если бэкенд ожидает /api в пути - не используем rewrite
        // Если бэкенд НЕ ожидает /api - используем rewrite
        // rewrite: (path) => path.replace(/^\/api/, ''),
        cookieDomainRewrite: 'localhost',
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          // Исправляем: добавляем префикс _ к неиспользуемым параметрам
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})



