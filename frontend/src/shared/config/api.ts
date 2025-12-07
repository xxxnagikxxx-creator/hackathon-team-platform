// Конфигурация API
// В режиме разработки используется прокси через Vite
// В продакшене используйте полный URL бэкенда

import axios from 'axios'

// Определяем режим: в продакшене import.meta.env.PROD = true, в разработке import.meta.env.DEV = true
const isDevelopment = import.meta.env.DEV
const isProduction = import.meta.env.PROD

// Базовый URL для API запросов
// В разработке используем относительный путь (проксируется через Vite)
// В продакшене используем относительный путь /api (проксируется через nginx на backend:8000)
// Или можно использовать переменную окружения VITE_API_URL для кастомного URL
export const API_BASE_URL = isProduction
  ? (import.meta.env.VITE_API_URL || '/api') // В продакшене nginx проксирует /api на backend:8000
  : '/api' // В разработке проксируется на http://backend:8000 через Vite

// Создаем общий экземпляр axios с базовыми настройками
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Важно для работы с cookies (access_token, captain-access-token)
  // Добавьте здесь общие interceptors, если нужно
  // Например, для добавления токена авторизации
})

// Interceptor для обработки ошибок (опционально)
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method?.toUpperCase(), response.config.url, response.status)
    return response
  },
  (error) => {
    // Здесь можно добавить общую обработку ошибок
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
    })
    return Promise.reject(error)
  }
)

// Interceptor для логирования запросов
apiClient.interceptors.request.use(
  (config) => {
    const method = config.method?.toUpperCase() || 'UNKNOWN'
    const url = (config.baseURL || '') + (config.url || '')
    console.log('API Request:', method, url, config.data)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

