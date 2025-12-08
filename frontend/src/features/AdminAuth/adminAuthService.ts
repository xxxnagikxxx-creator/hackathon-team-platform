import { apiClient } from '../../shared/config/api'

export type AdminLoginRequest = {
  email: string
  password: string
}

export type AdminLoginResponse = {
  message: string
}

export type AdminLogoutResponse = {
  message: string
}

export const adminAuthService = {
  async login(email: string, password: string): Promise<AdminLoginResponse> {
    console.log('adminAuthService.login: Отправка запроса на /admin/login')
    try {
      const response = await apiClient.post<AdminLoginResponse>('/admin/login', {
        email: email.trim().toLowerCase(),
        password: password,
      })
      console.log('adminAuthService.login: Успешный ответ:', response.data)
      return response.data
    } catch (error: any) {
      console.error('adminAuthService.login: Ошибка запроса:', {
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

  async logout(): Promise<AdminLogoutResponse> {
    const response = await apiClient.post<AdminLogoutResponse>('/admin/logout')
    return response.data
  },
}
