import type { Hackathon, CreateHackathonDto, UpdateHackathonDto, BackendHackInfo } from '../model/hackathon'
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
    participantsCount: 45,
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
    participantsCount: 127,
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
    participantsCount: 32,
    createdAt: '2024-11-10T00:00:00Z',
    updatedAt: '2024-11-10T00:00:00Z',
  },
]

// Флаг для использования мок-данных (установите в true для тестирования без API)
const USE_MOCK_DATA = false

// Маппер для преобразования Backend HackInfo в Frontend Hackathon
function mapBackendHackToHackathon(backendHack: BackendHackInfo): Hackathon {
  // Преобразуем base64 в data URL для отображения
  const imageUrl = backendHack.pic 
    ? (backendHack.pic.startsWith('data:') ? backendHack.pic : `data:image/jpeg;base64,${backendHack.pic}`)
    : ''

  // Преобразуем date формат (YYYY-MM-DD) - оставляем только дату без времени
  // Если есть время, убираем его, оставляем только дату
  const startDate = backendHack.start_date.includes('T') 
    ? backendHack.start_date.split('T')[0]
    : backendHack.start_date
  const endDate = backendHack.end_date.includes('T')
    ? backendHack.end_date.split('T')[0]
    : backendHack.end_date

  return {
    id: backendHack.hack_id,
    title: backendHack.title,
    description: backendHack.description,
    imageUrl,
    startDate,
    endDate,
    location: backendHack.location || undefined,
    maxParticipants: backendHack.max_participants || undefined,
    participantsCount: backendHack.participants_count || 0,
    createdAt: new Date().toISOString(), // Нет на бэке
    updatedAt: new Date().toISOString(), // Нет на бэке
  }
}

// Маппер для преобразования Frontend CreateHackathonDto в Backend CreateHack
function mapCreateHackathonToBackend(data: CreateHackathonDto): {
  title: string
  description: string
  pic: string
  event_date: string
  start_date: string
  end_date: string
  location?: string | null
  max_participants?: number | null
} {
  // Извлекаем base64 из data URL если нужно
  let pic = data.imageUrl
  if (pic.startsWith('data:')) {
    // Убираем префикс data:image/...;base64,
    const base64Index = pic.indexOf('base64,')
    if (base64Index !== -1) {
      pic = pic.substring(base64Index + 7)
    }
  }

  // Преобразуем date формат (YYYY-MM-DD) - убираем время если есть
  const startDate = data.startDate.includes('T') ? data.startDate.split('T')[0] : data.startDate
  const endDate = data.endDate.includes('T') ? data.endDate.split('T')[0] : data.endDate

  return {
    title: data.title,
    description: data.description,
    pic: pic,
    event_date: startDate, 
    start_date: startDate,
    end_date: endDate,
    location: data.location || null,
    max_participants: data.maxParticipants || null,
  }
}

export const hackathonService = {
  // Получить все хакатоны
  async getAll(): Promise<Hackathon[]> {
    if (USE_MOCK_DATA) {
      return Promise.resolve(MOCK_HACKATHONS)
    }
    
    try {
      const response = await apiClient.get<BackendHackInfo[]>('/hackathons')
      return response.data.map(mapBackendHackToHackathon)
    } catch (error) {
      console.error('Ошибка загрузки хакатонов:', error)
      if (USE_MOCK_DATA) {
        return MOCK_HACKATHONS
      }
      throw error
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
      const response = await apiClient.get<BackendHackInfo>(`/hackathons/${id}`)
      return mapBackendHackToHackathon(response.data)
    } catch (error) {
      console.error('Ошибка загрузки хакатона:', error)
      if (USE_MOCK_DATA) {
        const hackathon = MOCK_HACKATHONS.find(h => h.id === id)
        if (hackathon) {
          return hackathon
        }
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
    
    try {
      const backendData = mapCreateHackathonToBackend(data)
      const response = await apiClient.post<BackendHackInfo>('/hackathons/create_hack', backendData)
      return mapBackendHackToHackathon(response.data)
    } catch (error) {
      console.error('Ошибка создания хакатона:', error)
      throw error
    }
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
    
    try {
      // Преобразуем UpdateHackathonDto в формат для бэка
      const updateData: any = {}
      
      if (data.title !== undefined) updateData.title = data.title
      if (data.description !== undefined) updateData.description = data.description
      if (data.imageUrl !== undefined) {
        // Извлекаем base64 из data URL если нужно
        let pic = data.imageUrl
        if (pic.startsWith('data:')) {
          const base64Index = pic.indexOf('base64,')
          if (base64Index !== -1) {
            pic = pic.substring(base64Index + 7)
          }
        }
        updateData.pic = pic
      }
      
      // Преобразуем date формат - убираем время если есть
      if (data.startDate !== undefined) {
        const startDate = data.startDate.includes('T') ? data.startDate.split('T')[0] : data.startDate
        updateData.start_date = startDate
        updateData.event_date = startDate // Для обратной совместимости
      }
      if (data.endDate !== undefined) {
        const endDate = data.endDate.includes('T') ? data.endDate.split('T')[0] : data.endDate
        updateData.end_date = endDate
      }
      if (data.location !== undefined) {
        updateData.location = data.location || null
      }
      if (data.maxParticipants !== undefined) {
        updateData.max_participants = data.maxParticipants || null
      }

      const response = await apiClient.post<BackendHackInfo>(`/hackathons/${id}/update_hack`, updateData)
      return mapBackendHackToHackathon(response.data)
    } catch (error) {
      console.error('Ошибка обновления хакатона:', error)
      throw error
    }
  },

  async delete(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      const index = MOCK_HACKATHONS.findIndex(h => h.id === id)
      if (index !== -1) {
        MOCK_HACKATHONS.splice(index, 1)
      }
      return Promise.resolve()
    }
    
    try {
      await apiClient.post(`/hackathons/${id}/delete_hack`)
    } catch (error) {
      console.error('Ошибка удаления хакатона:', error)
      throw error
    }
  },

  async participate(id: number): Promise<void> {
    if (USE_MOCK_DATA) {
      console.log(`Участник присоединился к хакатону ${id}`)
      return Promise.resolve()
    }
    
    await apiClient.post(`/hackathons/${id}/participate`)
  },
}

