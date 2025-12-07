import { apiClient } from '../../shared/config/api'

export type LoginByCodeRequest = {
  code: string
}

export type LoginByCodeResponse = {
  detail: string
  telegram_id: string
}

export type LogoutResponse = {
  detail: string
}

export const authService = {
  async loginByCode(code: string): Promise<LoginByCodeResponse> {
    console.log('authService.loginByCode: Отправка запроса на /login-by-code с кодом:', code.substring(0, 4) + '...')
    try {
      const response = await apiClient.post<LoginByCodeResponse>('/login-by-code', {
        code: code.trim(),
      })
      console.log('authService.loginByCode: Успешный ответ:', response.data)
      return response.data
    } catch (error: any) {
      console.error('authService.loginByCode: Ошибка запроса:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
      })
      throw error
    }
  },

  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>('/logout')
    return response.data
  },
}

