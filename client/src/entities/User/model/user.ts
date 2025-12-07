export type User = {
  id: number
  email: string
  name: string
  avatarSrc?: string
  avatarUrl?: string
  role?: 'participant' | 'organizer' | 'admin'
  createdAt: string
}

export type UserRole = 'participant' | 'organizer' | 'admin'
