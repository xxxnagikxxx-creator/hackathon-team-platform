import type { Team, CreateTeamDto, InviteMemberDto } from '../model/team'
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
    name: 'FullStack Fusion',
    hackathonId: 1,
    members: [MOCK_PARTICIPANTS[0], MOCK_PARTICIPANTS[1]],
    maxMembers: 5,
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2024-11-20T00:00:00Z',
  },
  {
    id: 2,
    name: 'Code Warriors',
    hackathonId: 2,
    members: [MOCK_PARTICIPANTS[2]],
    maxMembers: 4,
    createdAt: '2024-11-05T00:00:00Z',
    updatedAt: '2024-11-18T00:00:00Z',
  },
]

const USE_MOCK_DATA = true

export const teamService = {
  // Получить все команды
  async getAll(): Promise<Team[]> {
    if (USE_MOCK_DATA) {
      return Promise.resolve(MOCK_TEAMS)
    }
    
    try {
      const response = await apiClient.get<Team[]>('/teams')
      return response.data
    } catch (error) {
      console.error('Ошибка загрузки команд:', error)
      return MOCK_TEAMS
    }
  },

  // Получить команду по ID
  async getById(id: number): Promise<Team> {
    if (USE_MOCK_DATA) {
      const team = MOCK_TEAMS.find(t => t.id === id)
      if (!team) {
        throw new Error('Команда не найдена')
      }
      return Promise.resolve(team)
    }
    
    try {
      const response = await apiClient.get<Team>(`/teams/${id}`)
      return response.data
    } catch (error) {
      console.error('Ошибка загрузки команды:', error)
      const team = MOCK_TEAMS.find(t => t.id === id)
      if (team) {
        return team
      }
      throw error
    }
  },

  // Создать команду
  async create(data: CreateTeamDto): Promise<Team> {
    if (USE_MOCK_DATA) {
      const newTeam: Team = {
        id: MOCK_TEAMS.length + 1,
        ...data,
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      MOCK_TEAMS.push(newTeam)
      return Promise.resolve(newTeam)
    }
    
    const response = await apiClient.post<Team>('/teams', data)
    return response.data
  },

  // Пригласить участника в команду
  async inviteMember(data: InviteMemberDto): Promise<void> {
    if (USE_MOCK_DATA) {
      console.log(`Приглашение участника ${data.participantId} в команду ${data.teamId}`)
      return Promise.resolve()
    }
    
    await apiClient.post(`/teams/${data.teamId}/invite`, { participantId: data.participantId })
  },

  // Покинуть команду
  async leaveTeam(teamId: number): Promise<void> {
    if (USE_MOCK_DATA) {
      const team = MOCK_TEAMS.find(t => t.id === teamId)
      if (team) {
        // Удаляем первого участника для примера
        team.members = team.members.slice(1)
        console.log(`Участник покинул команду ${teamId}`)
      }
      return Promise.resolve()
    }
    
    await apiClient.post(`/teams/${teamId}/leave`)
  },

  // Удалить участника из команды (только для капитана)
  async removeMember(teamId: number, participantId: number): Promise<void> {
    if (USE_MOCK_DATA) {
      const team = MOCK_TEAMS.find(t => t.id === teamId)
      if (team) {
        team.members = team.members.filter(m => m.id !== participantId)
        console.log(`Участник ${participantId} удален из команды ${teamId}`)
      }
      return Promise.resolve()
    }
    
    await apiClient.delete(`/teams/${teamId}/members/${participantId}`)
  },
}

