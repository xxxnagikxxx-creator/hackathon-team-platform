import type { Hackathon, CreateHackathonDto, UpdateHackathonDto } from '../model/hackathon'
import { apiClient } from '../../../shared/config/api'

// МОК-ДАННЫЕ для тестирования (используются если API недоступен)
const MOCK_HACKATHONS: Hackathon[] = [
  {
    id: 1,
    title: 'Хакатон «Следы хакера»',
    description: 'Примите участие в захватывающем состязании и продемонстрируйте свой профессионализм на одном из самых заметных отраслевых мероприятий — конференции «Сохранить всё: безопасность информации». Этот увлекательный и полезный опыт поможет вам эффективно применять продукты «Гарды» на практике. Шестерых победителей ждут мощные отечественные планшеты KVADRA_T от технологического партнёра мероприятия группы компаний YADRO.',
    imageUrl: 'https://garda.ai/_next/image?url=%2Fupload%2Fiblock%2F936%2Fsso7l5bijo7x7mmfkwjvsgsxjthkcbgy%2Fhackaton.webp&w=3840&q=75',
    startDate: '2024-12-01T10:00:00Z',
    endDate: '2024-12-03T18:00:00Z',
    location: 'Москва',
    maxParticipants: 100,
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2024-11-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'AI Hackathon 2024',
    description: 'Создайте инновационное решение с использованием искусственного интеллекта. Победители получат призы и возможность стажировки в ведущих IT-компаниях.',
    imageUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
    startDate: '2024-12-10T09:00:00Z',
    endDate: '2024-12-12T20:00:00Z',
    location: 'Онлайн',
    maxParticipants: 200,
    createdAt: '2024-11-05T00:00:00Z',
    updatedAt: '2024-11-05T00:00:00Z',
  },
  {
    id: 3,
    title: 'Blockchain Challenge',
    description: 'Разработайте децентрализованное приложение на блокчейне. Призовой фонд 500,000 рублей.',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    startDate: '2024-12-20T10:00:00Z',
    endDate: '2024-12-22T18:00:00Z',
    location: 'Санкт-Петербург',
    maxParticipants: 50,
    createdAt: '2024-11-10T00:00:00Z',
    updatedAt: '2024-11-10T00:00:00Z',
  },
]

// Флаг для использования мок-данных (установите в true для тестирования без API)
const USE_MOCK_DATA = true

export const hackathonService = {
  // Получить все хакатоны
  async getAll(): Promise<Hackathon[]> {
    if (USE_MOCK_DATA) {
      return Promise.resolve(MOCK_HACKATHONS)
    }
    
    try {
      const response = await apiClient.get<Hackathon[]>('/hackathons')
      return response.data
    } catch (error) {
      console.error('Ошибка загрузки хакатонов:', error)
      // Возвращаем мок-данные при ошибке
      return MOCK_HACKATHONS
    }
  },

  // Получить хакатон по ID
  async getById(id: number): Promise<Hackathon> {
    if (USE_MOCK_DATA) {
      const hackathon = MOCK_HACKATHONS.find(h => h.id === id)
      if (!hackathon) {
        throw new Error('Хакатон не найден')
      }
      return Promise.resolve(hackathon)
    }
    
    try {
      const response = await apiClient.get<Hackathon>(`/hackathons/${id}`)
      return response.data
    } catch (error) {
      console.error('Ошибка загрузки хакатона:', error)
      const hackathon = MOCK_HACKATHONS.find(h => h.id === id)
      if (hackathon) {
        return hackathon
      }
      throw error
    }
  },

  // Создать новый хакатон
  async create(data: CreateHackathonDto): Promise<Hackathon> {
    if (USE_MOCK_DATA) {
      const newHackathon: Hackathon = {
        id: MOCK_HACKATHONS.length + 1,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      MOCK_HACKATHONS.push(newHackathon)
      return Promise.resolve(newHackathon)
    }
    
    const response = await apiClient.post<Hackathon>('/hackathons', data)
    return response.data
  },

  // Обновить хакатон
  async update(id: number, data: UpdateHackathonDto): Promise<Hackathon> {
    if (USE_MOCK_DATA) {
      const index = MOCK_HACKATHONS.findIndex(h => h.id === id)
      if (index === -1) {
        throw new Error('Хакатон не найден')
      }
      MOCK_HACKATHONS[index] = {
        ...MOCK_HACKATHONS[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      return Promise.resolve(MOCK_HACKATHONS[index])
    }
    
    const response = await apiClient.patch<Hackathon>(`/hackathons/${id}`, data)
    return response.data
  },

  // Удалить хакатон
  async delete(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      const index = MOCK_HACKATHONS.findIndex(h => h.id === id)
      if (index !== -1) {
        MOCK_HACKATHONS.splice(index, 1)
      }
      return Promise.resolve()
    }
    
    await apiClient.delete(`/hackathons/${id}`)
  },

  // Присоединиться к хакатону
  async participate(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      console.log(`Участник присоединился к хакатону ${id}`)
      return Promise.resolve()
    }
    
    await apiClient.post(`/hackathons/${id}/participate`)
  },
}

