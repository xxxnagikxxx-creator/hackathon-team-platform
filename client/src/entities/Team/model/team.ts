import type { Participant } from '../../Participant/model/participant'

export type Team = {
  id: number
  name: string
  hackathonId: number
  members: Participant[]
  maxMembers?: number
  createdAt: string
  updatedAt: string
}

export type CreateTeamDto = {
  name: string
  hackathonId: number
  maxMembers?: number
}

export type InviteMemberDto = {
  teamId: number
  participantId: number
}

