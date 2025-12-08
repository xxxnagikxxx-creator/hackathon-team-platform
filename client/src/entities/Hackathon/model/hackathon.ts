export type Hackathon = {
  id: number
  title: string
  description: string
  imageUrl: string
  startDate: string
  endDate: string
  location?: string
  maxParticipants?: number
  createdAt: string
  updatedAt: string
}

export type CreateHackathonDto = {
  title: string
  description: string
  imageUrl: string
  startDate: string
  endDate: string
  location?: string
  maxParticipants?: number
}

export type UpdateHackathonDto = Partial<CreateHackathonDto>

