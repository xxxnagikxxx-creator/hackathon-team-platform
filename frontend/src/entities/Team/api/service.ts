import type { Team, CreateTeamDto, UpdateTeamDto, EnterTeamDto, BackendTeamInfo, BackendShortTeamInfo } from '../model/team'
import type { TeamInvitation, BackendTeamInvitation } from '../model/invitation'
import type { Participant } from '../../Participant/model/participant'
import { apiClient } from '../../../shared/config/api'

// МОК-ДАННЫЕ для тестирования
const MOCK_PARTICIPANTS: Participant[] = [
  {
    id: 1,
    name: 'Игорь Сырцов',
    email: 'igor@example.com',
    tgTag: 'sdivn',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    role: 'Фронтенд разработчик',
    skills: ['React', 'TypeScript', 'SCSS'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-11-20T00:00:00Z',
  },
  {
    id: 2,
    name: 'Анна Петрова',
    email: 'anna@example.com',
    tgTag: 'njs',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    role: 'Бэкенд разработчик',
    skills: ['Node.js', 'Python', 'PostgreSQL'],
    createdAt: '2024-02-10T00:00:00Z',
    updatedAt: '2024-11-18T00:00:00Z',
  },
  {
    id: 3,
    name: 'Дмитрий Иванов',
    email: 'dmitry@example.com',
    tgTag: 'jdvn',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    role: 'UI/UX дизайнер',
    skills: ['Figma', 'Adobe XD', 'Sketch'],
    createdAt: '2024-03-05T00:00:00Z',
    updatedAt: '2024-11-19T00:00:00Z',
  },
]

const MOCK_TEAMS: Team[] = [
  {
    id: 1,
    title: 'FullStack Fusion',
    description: 'Команда для разработки fullstack приложений',
    captain: MOCK_PARTICIPANTS[0],
    participants: [MOCK_PARTICIPANTS[1]],
  },
  {
    id: 2,
    title: 'Code Warriors',
    description: 'Команда опытных разработчиков',
    captain: MOCK_PARTICIPANTS[2],
    participants: [],
  },
]

const USE_MOCK_DATA = false

// Маппер для преобразования UserInfo (Backend) в Participant (Frontend)
function mapUserInfoToParticipant(userInfo: {
  telegram_id: string
  fullname: string
  pic: string
  role?: string | null
  description?: string | null
  tags?: string[] | null
}): Participant {
  // Преобразуем base64 в data URL для отображения
  const avatarUrl = userInfo.pic 
    ? (userInfo.pic.startsWith('data:') ? userInfo.pic : `data:image/jpeg;base64,${userInfo.pic}`)
    : undefined

  return {
    id: parseInt(userInfo.telegram_id) || 0, // Временное решение, лучше использовать telegram_id как строку
    name: userInfo.fullname,
    email: '', // Нет на бэке
    tgTag: userInfo.telegram_id,
    avatarUrl,
    role: userInfo.role || '',
    skills: userInfo.tags || [],
    bio: userInfo.description || undefined,
    createdAt: new Date().toISOString(), // Нет на бэке
    updatedAt: new Date().toISOString(), // Нет на бэке
  }
}

// Маппер для преобразования BackendTeamInfo в Team
function mapBackendTeamToTeam(backendTeam: BackendTeamInfo): Team {
  return {
    id: backendTeam.team_id,
    title: backendTeam.title,
    description: backendTeam.description || '',
    captain: mapUserInfoToParticipant(backendTeam.captain),
    participants: backendTeam.participants.map(mapUserInfoToParticipant),
    password: backendTeam.password,
    hackathonId: backendTeam.hackathon_id,
  }
}

export const teamService = {
  // Получить все команды
  async getAll(hackathonId?: number): Promise<Team[]> {
    if (USE_MOCK_DATA) {
      return Promise.resolve(MOCK_TEAMS)
    }
    
    try {
      const params = hackathonId ? { hackathon_id: hackathonId } : {}
      const response = await apiClient.get<BackendShortTeamInfo[]>('/teams', { params })
      // Для списка команд нужно получить полную информацию
      // Но бэкенд возвращает только ShortTeamInfo, поэтому нужно будет делать дополнительные запросы
      // Или изменить бэкенд, чтобы возвращал полную информацию
      // Пока используем упрощенный вариант
      const teams: Team[] = []
      for (const shortTeam of response.data) {
        try {
          const fullTeam = await this.getById(shortTeam.team_id)
          teams.push(fullTeam)
        } catch (error) {
          console.error(`Ошибка загрузки команды ${shortTeam.team_id}:`, error)
        }
      }
      return teams
    } catch (error) {
      console.error('Ошибка загрузки команд:', error)
      if (USE_MOCK_DATA) {
      return MOCK_TEAMS
      }
      throw error
    }
  },

  // Получить команду по ID
  async getById(id: number): Promise<Team> {
    console.log('teamService.getById called with id:', id)
    if (USE_MOCK_DATA) {
      const team = MOCK_TEAMS.find(t => t.id === id)
      if (!team) {
        throw new Error('Команда не найдена')
      }
      return Promise.resolve(team)
    }
    
    try {
      const response = await apiClient.get<BackendTeamInfo>(`/teams/${id}`)
      console.log('teamService.getById response:', response.data)
      const mappedTeam = mapBackendTeamToTeam(response.data)
      console.log('teamService.getById mapped team:', mappedTeam)
      return mappedTeam
    } catch (error) {
      console.error('Ошибка загрузки команды:', error)
      if (USE_MOCK_DATA) {
      const team = MOCK_TEAMS.find(t => t.id === id)
      if (team) {
        return team
        }
      }
      throw error
    }
  },

  // Создать команду
  async create(data: CreateTeamDto): Promise<Team> {
    if (USE_MOCK_DATA) {
      const newTeam: Team = {
        id: MOCK_TEAMS.length + 1,
        title: data.title,
        description: data.description || '',
        captain: MOCK_PARTICIPANTS[0],
        participants: [],
      }
      MOCK_TEAMS.push(newTeam)
      return Promise.resolve(newTeam)
    }
    
    try {
      const payload = {
        title: data.title,
        description: data.description || null,
        hackathon_id: data.hackathonId,  // Обязательное поле
      }
      const response = await apiClient.post<BackendTeamInfo>('/teams/create', payload)
      return mapBackendTeamToTeam(response.data)
    } catch (error) {
      console.error('Ошибка создания команды:', error)
      throw error
    }
  },

  // Обновить команду (только для капитана)
  async update(teamId: number, data: UpdateTeamDto): Promise<Team> {
    if (USE_MOCK_DATA) {
      const team = MOCK_TEAMS.find(t => t.id === teamId)
      if (!team) {
        throw new Error('Команда не найдена')
      }
      team.title = data.title
      team.description = data.description
      return Promise.resolve(team)
    }
    
    try {
      const response = await apiClient.put<BackendTeamInfo>(`/teams/${teamId}`, {
        title: data.title,
        description: data.description,
      })
      return mapBackendTeamToTeam(response.data)
    } catch (error) {
      console.error('Ошибка обновления команды:', error)
      throw error
    }
  },

  // Удалить команду (только для капитана)
  async delete(teamId: number): Promise<void> {
    if (USE_MOCK_DATA) {
      const index = MOCK_TEAMS.findIndex(t => t.id === teamId)
      if (index !== -1) {
        MOCK_TEAMS.splice(index, 1)
      }
      return Promise.resolve()
    }
    
    try {
      await apiClient.delete(`/teams/${teamId}`)
    } catch (error) {
      console.error('Ошибка удаления команды:', error)
      throw error
    }
  },

  // Войти в команду по паролю
  async enterTeam(teamId: number, data: EnterTeamDto): Promise<Team> {
    if (USE_MOCK_DATA) {
      const team = MOCK_TEAMS.find(t => t.id === teamId)
      if (!team) {
        throw new Error('Команда не найдена')
      }
      // Симуляция входа
      return Promise.resolve(team)
    }
    
    try {
      const response = await apiClient.post<BackendTeamInfo>(`/teams/${teamId}/enter`, {
        password: data.password,
      })
      return mapBackendTeamToTeam(response.data)
    } catch (error) {
      console.error('Ошибка входа в команду:', error)
      throw error
    }
  },

  // Покинуть команду
  async leaveTeam(teamId: number): Promise<Team> {
    if (USE_MOCK_DATA) {
      const team = MOCK_TEAMS.find(t => t.id === teamId)
      if (!team) {
        throw new Error('Команда не найдена')
      }
      // Симуляция выхода
      return Promise.resolve(team)
    }
    
    try {
      const response = await apiClient.post<BackendTeamInfo>(`/teams/${teamId}/leave`)
      return mapBackendTeamToTeam(response.data)
    } catch (error) {
      console.error('Ошибка выхода из команды:', error)
      throw error
    }
  },

  // Удалить участника из команды (только для капитана)
  async removeParticipant(teamId: number, participantId: string | number): Promise<Team> {
    if (USE_MOCK_DATA) {
      const team = MOCK_TEAMS.find(t => t.id === teamId)
      if (!team) {
        throw new Error('Команда не найдена')
      }
      return Promise.resolve(team)
    }
    
    try {
      const response = await apiClient.post<BackendTeamInfo>(`/teams/${teamId}/remove-participant/${participantId}`)
      return mapBackendTeamToTeam(response.data)
    } catch (error) {
      console.error('Ошибка удаления участника:', error)
      throw error
    }
  },

  // Получить приглашения команды (только для капитана)
  async getTeamInvitations(teamId: number): Promise<TeamInvitation[]> {
    try {
      const response = await apiClient.get<BackendTeamInvitation[]>(`/teams/${teamId}/invitations`)
      return response.data.map(mapBackendInvitationToInvitation)
    } catch (error) {
      console.error('Ошибка загрузки приглашений:', error)
      throw error
    }
  },

  // Одобрить запрос на вступление
  async approveJoinRequest(invitationId: number): Promise<void> {
    try {
      await apiClient.post(`/teams/invitations/${invitationId}/approve`)
    } catch (error) {
      console.error('Ошибка одобрения запроса:', error)
      throw error
    }
  },

  // Отклонить запрос на вступление
  async declineInvitation(invitationId: number): Promise<void> {
    try {
      await apiClient.post(`/teams/invitations/${invitationId}/decline`)
    } catch (error) {
      console.error('Ошибка отклонения запроса:', error)
      throw error
    }
  },

  // Отправить запрос на вступление в команду
  async requestJoinTeam(teamId: number): Promise<TeamInvitation> {
    try {
      const response = await apiClient.post<BackendTeamInvitation>(`/teams/${teamId}/request-join`)
      return mapBackendInvitationToInvitation(response.data)
    } catch (error) {
      console.error('Ошибка отправки запроса на вступление:', error)
      throw error
    }
  },

  // Получить свои приглашения
  async getMyInvitations(hackathonId?: number): Promise<TeamInvitation[]> {
    try {
      const params = hackathonId ? { hackathon_id: hackathonId } : {}
      const response = await apiClient.get<BackendTeamInvitation[]>(`/teams/invitations/my`, { params })
      return response.data.map(mapBackendInvitationToInvitation)
    } catch (error) {
      console.error('Ошибка загрузки приглашений:', error)
      throw error
    }
  },
}

// Маппер для преобразования BackendTeamInvitation в TeamInvitation
function mapBackendInvitationToInvitation(backend: BackendTeamInvitation): TeamInvitation {
  return {
    invitationId: backend.invitation_id,
    teamId: backend.team_id,
    hackathonId: backend.hackathon_id,
    captainId: backend.captain_id,
    participantId: backend.participant_id,
    status: backend.status as 'pending' | 'accepted' | 'declined',
    requestedBy: backend.requested_by as 'captain' | 'participant',
    createdAt: backend.created_at,
    updatedAt: backend.updated_at,
  }
}

