import type { Participant } from '../../Participant/model/participant'

export type Team = {
  id: number
  title: string
  description: string
  captain: Participant
  participants: Participant[]
  password?: string | null // Только для капитана
  hackathonId?: number // ID хакатона, в котором участвует команда
}

export type CreateTeamDto = {
  title: string
  description?: string | null
  hackathonId: number
}

export type UpdateTeamDto = {
  title: string
  description: string
}

export type EnterTeamDto = {
  password: string
}

// Backend типы для маппинга
export type BackendTeamInfo = {
  team_id: number
  hackathon_id: number
  title: string
  description: string
  captain: {
    telegram_id: string
    fullname: string
    pic: string
    role?: string | null
    description?: string | null
    tags?: string[] | null
  }
  participants: Array<{
    telegram_id: string
    fullname: string
    pic: string
    role?: string | null
    description?: string | null
    tags?: string[] | null
  }>
  password?: string | null
}

export type BackendShortTeamInfo = {
  team_id: number
  title: string
  description: string
}

