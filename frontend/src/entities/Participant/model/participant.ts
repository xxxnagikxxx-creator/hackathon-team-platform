export type Participant = {
  id: number
  name: string
  email: string
  tgTag: string
  avatarUrl?: string
  role: string
  skills?: string[]
  bio?: string
  team?: {
    team_id: number
    title: string
    description: string
  } | null
  createdAt: string
  updatedAt: string
}

export type UpdateParticipantDto = {
  name?: string
  role?: string
  skills?: string[]
  bio?: string
  avatarUrl?: string
  updatedAt?: string
}