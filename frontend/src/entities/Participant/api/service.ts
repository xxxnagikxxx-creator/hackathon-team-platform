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

const USE_MOCK_DATA = false

type BackendUserInfo = {
  telegram_id: string
  fullname: string
  username?: string | null  // Добавляем username
  pic: string
  role?: string | null
  description?: string | null
  tags?: string[] | null
  team?: {
    team_id: number
    title: string
    description: string
  } | null
}

// Маппер для преобразования данных с бэкенда в формат фронтенда
function mapBackendUserToParticipant(backendUser: BackendUserInfo): Participant {
  console.log('mapBackendUserToParticipant: Получены данные с бэкенда (полный объект):', JSON.stringify(backendUser, null, 2))
  console.log('mapBackendUserToParticipant: Получены данные с бэкенда:', {
    telegram_id: backendUser.telegram_id,
    fullname: backendUser.fullname,
    username: backendUser.username,
    fullnameType: typeof backendUser.fullname,
    fullnameLength: backendUser.fullname?.length,
    usernameType: typeof backendUser.username,
    usernameValue: backendUser.username,
    role: backendUser.role,
  })
  
  // Обрабатываем аватар: если pic пустая строка или null, то avatarUrl будет undefined
  let avatarUrl: string | undefined = undefined
  if (backendUser.pic && backendUser.pic.trim() !== '') {
    // Если pic уже содержит data: URL, используем как есть, иначе добавляем префикс
    if (backendUser.pic.startsWith('data:')) {
      avatarUrl = backendUser.pic
    } else {
      avatarUrl = `data:image/jpeg;base64,${backendUser.pic}`
    }
  }
  
  // Используем username, если он есть и не пустой, иначе fullname, иначе "Без имени"
  const mappedName = (backendUser.username && backendUser.username.trim() !== '') 
    ? backendUser.username.trim() 
    : (backendUser.fullname && backendUser.fullname.trim() !== '') 
      ? backendUser.fullname.trim() 
      : 'Без имени'
  
  console.log('mapBackendUserToParticipant: Маппинг имени:', {
    username: backendUser.username,
    usernameTrimmed: backendUser.username?.trim(),
    fullname: backendUser.fullname,
    fullnameTrimmed: backendUser.fullname?.trim(),
    mapped: mappedName,
  })
  
  return {
    id: parseInt(backendUser.telegram_id) || 0, // Используем telegram_id как id
    name: mappedName,
    email: '', // Email не приходит с бэкенда
    tgTag: backendUser.telegram_id, // Используем telegram_id как tgTag
    avatarUrl,
    role: backendUser.role || '',
    skills: backendUser.tags || [],
    bio: backendUser.description || '',
    team: backendUser.team || null, // Информация о команде
    createdAt: new Date().toISOString(), // Эти поля не приходят с бэкенда
    updatedAt: new Date().toISOString(),
  }
}

export const participantService = {
  // Получить всех участников
  async getAll(): Promise<Participant[]> {
    if (USE_MOCK_DATA) {
      return Promise.resolve(MOCK_PARTICIPANTS)
    }
    
    try {
      const response = await apiClient.get<BackendUserInfo[]>('/participants')
      return response.data.map(mapBackendUserToParticipant)
    } catch (error) {
      console.error('Ошибка загрузки участников:', error)
      if (USE_MOCK_DATA) {
        return MOCK_PARTICIPANTS
      }
      throw error
    }
  },

  // Получить участника по ID (может быть числовой ID или telegram_id как строка)
  async getById(id: number | string): Promise<Participant> {
    if (USE_MOCK_DATA) {
      const participant = MOCK_PARTICIPANTS.find(p => p.id === Number(id))
      if (participant) {
        return Promise.resolve(participant)
      }
    }
    
    try {
      // Бэкенд принимает telegram_id как строку в пути /api/participants/{telegram_id}
      const response = await apiClient.get<BackendUserInfo>(`/participants/${id}`)
      return mapBackendUserToParticipant(response.data)
    } catch (error: any) {
      console.error('Ошибка загрузки участника:', error)
      
      // Если это 404, пробуем найти в мок-данных
      if (error?.response?.status === 404 && USE_MOCK_DATA) {
        const participant = MOCK_PARTICIPANTS.find(p => p.id === Number(id))
        if (participant) {
          return participant
        }
      }
      
      // Пробрасываем ошибку дальше
      throw error
    }
  },

  // Получить текущего пользователя (участника)
  // Принимает telegramId, так как эндпоинта /participants/me нет на бэкенде
  async getCurrent(telegramId?: string): Promise<Participant> {
    if (USE_MOCK_DATA) {
      return Promise.resolve(MOCK_PARTICIPANTS[0])
    }
    
    if (!telegramId) {
      throw new Error('telegramId is required to get current user')
    }
    
    const response = await apiClient.get<BackendUserInfo>(`/participants/${telegramId}`)
    return mapBackendUserToParticipant(response.data)
  },

  // Обновить профиль участника
  // id может быть числом или строкой (telegram_id)
  async update(id: number | string, data: UpdateParticipantDto): Promise<Participant> {
    if (USE_MOCK_DATA) {
      const index = MOCK_PARTICIPANTS.findIndex(p => p.id === Number(id))
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
    
    // Маппим данные фронтенда в формат бэкенда
    // Не отправляем пустые значения, чтобы они не перезаписывали существующие данные
    // ВАЖНО: отправляем ТОЛЬКО username, НЕ отправляем fullname
    const backendData: any = {}
    if (data.name !== undefined && data.name !== null && data.name.trim() !== '') {
      backendData.username = data.name.trim()  // Используем username вместо fullname
      // НЕ отправляем fullname - только username
    }
    if (data.role !== undefined && data.role !== null && data.role !== '') {
      backendData.role = data.role
    }
    if (data.bio !== undefined && data.bio !== null && data.bio.trim() !== '') {
      backendData.description = data.bio.trim()
    }
    if (data.skills !== undefined && data.skills !== null) {
      backendData.tags = data.skills
    }
    // Явно не отправляем fullname, чтобы избежать конфликтов
    
    const response = await apiClient.post<BackendUserInfo>(`/participants/${id}`, backendData)
    return mapBackendUserToParticipant(response.data)
  },

  // Обновить текущего пользователя
  // Принимает telegramId, так как эндпоинта /participants/me нет на бэкенде
  async updateCurrent(telegramId: string, data: UpdateParticipantDto): Promise<Participant> {
    if (USE_MOCK_DATA) {
      MOCK_PARTICIPANTS[0] = {
        ...MOCK_PARTICIPANTS[0],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      return Promise.resolve(MOCK_PARTICIPANTS[0])
    }
    
    // Маппим данные фронтенда в формат бэкенда
    // Не отправляем пустые значения, чтобы они не перезаписывали существующие данные
    // ВАЖНО: отправляем ТОЛЬКО username, НЕ отправляем fullname
    const backendData: any = {}
    if (data.name !== undefined && data.name !== null && data.name.trim() !== '') {
      backendData.username = data.name.trim()  // Используем username вместо fullname
      // НЕ отправляем fullname - только username
    }
    if (data.role !== undefined && data.role !== null && data.role !== '') {
      backendData.role = data.role
    }
    if (data.bio !== undefined && data.bio !== null && data.bio.trim() !== '') {
      backendData.description = data.bio.trim()
    }
    if (data.skills !== undefined && data.skills !== null) {
      backendData.tags = data.skills
    }
    // Явно не отправляем fullname, чтобы избежать конфликтов
    
    console.log('participantService.updateCurrent: Отправка данных на бэкенд:', {
      telegramId,
      backendData,
      originalData: data,
      backendDataJSON: JSON.stringify(backendData, null, 2)
    })
    
    const response = await apiClient.post<BackendUserInfo>(`/participants/${telegramId}`, backendData)
    
    console.log('participantService.updateCurrent: Ответ от бэкенда (полный JSON):', JSON.stringify(response.data, null, 2))
    console.log('participantService.updateCurrent: Ответ от бэкенда:', {
      telegram_id: response.data.telegram_id,
      fullname: response.data.fullname,
      username: response.data.username,
      role: response.data.role,
    })
    return mapBackendUserToParticipant(response.data)
  },
}

