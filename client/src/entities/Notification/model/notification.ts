// export type NotificationType = 'team_invite' | 'hackathon_update' | 'system

export type Notification = {
  id: number
  commandName: string
  relatedId?: number // ID связанной сущности (кто кинул приглос)
  name: string
  createdAt: string
  tgTag: string
}
