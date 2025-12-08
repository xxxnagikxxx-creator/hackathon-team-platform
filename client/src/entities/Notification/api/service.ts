import axios from 'axios'
import type { Notification } from '../model/notification'
import { API_BASE_URL } from '../../../shared/config/api'

const notificationApi = axios.create({
  baseURL: `${API_BASE_URL}/notifications`,
})

// МОК-ДАННЫЕ ДЛЯ ПРИМЕРА (раскомментируйте для тестирования без API):
// const MOCK_NOTIFICATIONS: Notification[] = [
//   {
//     id: 1,
//     commandName: 'fullstack fusion',
//     relatedId: 1,
//     name: 'Игорь',
//     createdAt: '2024-11-20T10:00:00Z',
//     tgTag: 'https://t.me/@tgIngvar'
//   },
//   {
//     id: 2,
//     commandName: 'fullstack fusion',
//     relatedId: 1,
//     name: 'Игорь',
//     createdAt: '2024-11-20T10:00:00Z',
//   },
//   {
//     id: 3,
//     commandName: 'fullstack fusion',
//     relatedId: 1,
//     name: 'катя',
//     createdAt: '2024-11-20T10:00:00Z',
//   }
// ]

export const notificationService = {
  // Получить все уведомления текущего пользователя
  async getAll(): Promise<Notification[]> {
    // Для тестирования без API раскомментируйте следующую строку:
    // return Promise.resolve(MOCK_NOTIFICATIONS)
    
    const response = await notificationApi.get<Notification[]>('/')
    return response.data
  }
}

