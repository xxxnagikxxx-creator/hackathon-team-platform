export type Hackathon = {
  id: number
  title: string
  description: string
  imageUrl: string
  startDate: string
  endDate: string
  location?: string
  maxParticipants?: number
  participantsCount?: number
  createdAt: string
  updatedAt: string
}


export type BackendHackInfo = {
  hack_id: number
  title: string
  description: string
  pic: string  
  event_date: string  
  start_date: string
  end_date: string
  location?: string | null
  participants_count?: number
  max_participants?: number | null
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

