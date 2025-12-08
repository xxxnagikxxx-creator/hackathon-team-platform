import axios from 'axios'
import type { User } from '../model/user'
import { API_BASE_URL } from '../../../shared/config/api'

const userApi = axios.create({
  baseURL: `${API_BASE_URL}/users`,
})

export const userService = {
  // Получить текущего пользователя
  async getCurrent(): Promise<User> {
    const response = await userApi.get<User>('/me')
    return response.data
  },

  // Получить пользователя по ID
  async getById(id: number): Promise<User> {
    const response = await userApi.get<User>(`/${id}`)
    return response.data
  },
}

