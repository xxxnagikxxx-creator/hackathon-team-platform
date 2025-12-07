// Конфигурация API
// В режиме разработки используется прокси через Vite
// В продакшене используйте полный URL бэкенда

import axios from 'axios'

const isDevelopment = import.meta.env.DEV

// Базовый URL для API запросов
// В разработке используем относительный путь (проксируется через Vite)
// В продакшене можно использовать переменную окружения или полный URL
export const API_BASE_URL = isDevelopment
  ? '/api' // Проксируется на http://backend:8000 через Vite
  : import.meta.env.VITE_API_URL || 'http://backend:8000'

// Создаем общий экземпляр axios с базовыми настройками
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Добавьте здесь общие interceptors, если нужно
  // Например, для добавления токена авторизации
})

// Interceptor для обработки ошибок (опционально)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Здесь можно добавить общую обработку ошибок
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

