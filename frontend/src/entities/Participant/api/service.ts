import type { Participant, UpdateParticipantDto } from '../model/participant'
import { apiClient } from '../../../shared/config/api'

// МОК-ДАННЫЕ для тестирования
const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: 1,
    name: 'Игорь Сырцов',
    email: 'igor@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    tgTag: 'sdivn',
    role: 'Фронтенд разработчик',
    skills: ['React', 'TypeScript', 'SCSS', 'Axios', 'Git'],
    bio: 'Опытный фронтенд разработчик с 5+ годами опыта',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-11-20T00:00:00Z',
  },
  {
    id: 2,
    name: 'Анна Петрова',
    email: 'anna@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    role: 'Бэкенд разработчик',
    tgTag: 'njs',
    skills: ['Node.js', 'Python', 'PostgreSQL', 'Docker'],
    bio: 'Fullstack разработчик, специализируюсь на микросервисной архитектуре',
    createdAt: '2024-02-10T00:00:00Z',
    updatedAt: '2024-11-18T00:00:00Z',
  },
  {
    id: 3,
    name: 'Дмитрий Иванов',
    email: 'dmitry@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    role: 'UI/UX дизайнер',
    tgTag: 'jdvn',
    skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping'],
    bio: 'Создаю красивые и функциональные интерфейсы',
    createdAt: '2024-03-05T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
  {
    id: 4,
    name: 'Мария Сидорова',
    email: 'maria@example.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=9',
    role: 'Мобильный разработчик',
    tgTag: 'vdnasl',
    skills: ['React Native', 'Swift', 'Kotlin', 'Flutter'],
    bio: 'Разрабатываю мобильные приложения для iOS и Android',
    createdAt: '2024-04-20T00:00:00Z',
    updatedAt: '2024-11-17T00:00:00Z',
  },
]

const USE_MOCK_DATA = true

export const participantService = {
  // Получить всех участников
  async getAll(): Promise<Participant[]> {
    if (USE_MOCK_DATA) {
      return Promise.resolve(MOCK_PARTICIPANTS)
    }
    
    try {
      const response = await apiClient.get<Participant[]>('/participants')
      return response.data
    } catch (error) {
      console.error('Ошибка загрузки участников:', error)
      return MOCK_PARTICIPANTS
    }
  },

  // Получить участника по ID
  async getById(id: number): Promise<Participant> {

    
    try {
      const response = await apiClient.get<Participant>(`/participants/${id}`)
      return response.data
    } catch (error) {
      console.error('Ошибка загрузки участника:', error)
      const participant = MOCK_PARTICIPANTS.find(p => p.id === id)
      if (participant) {
        return participant
      }
      throw error
    }
  },

  // Получить текущего пользователя (участника)
  async getCurrent(): Promise<Participant> {
    if (USE_MOCK_DATA) {
      return Promise.resolve(MOCK_PARTICIPANTS[0])
    }
    
    const response = await apiClient.get<Participant>('/participants/me')
    return response.data
  },

  // Обновить профиль участника
  async update(id: number, data: UpdateParticipantDto): Promise<Participant> {
    if (USE_MOCK_DATA) {
      const index = MOCK_PARTICIPANTS.findIndex(p => p.id === id)
      if (index === -1) {
        throw new Error('Участник не найден')
      }
      MOCK_PARTICIPANTS[index] = {
        ...MOCK_PARTICIPANTS[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      return Promise.resolve(MOCK_PARTICIPANTS[index])
    }
    
    const response = await apiClient.patch<Participant>(`/participants/${id}`, data)
    return response.data
  },

  // Обновить текущего пользователя
  async updateCurrent(data: UpdateParticipantDto): Promise<Participant> {
    if (USE_MOCK_DATA) {
      MOCK_PARTICIPANTS[0] = {
        ...MOCK_PARTICIPANTS[0],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      return Promise.resolve(MOCK_PARTICIPANTS[0])
    }
    
    const response = await apiClient.patch<Participant>('/participants/me', data)
    return response.data
  },
}

