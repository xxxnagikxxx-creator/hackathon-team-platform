export type TeamInvitation = {
  invitationId: number
  teamId: number
  hackathonId: number
  captainId: string
  participantId: string
  status: 'pending' | 'accepted' | 'declined'
  requestedBy: 'captain' | 'participant'
  createdAt: string
  updatedAt: string
}

export type BackendTeamInvitation = {
  invitation_id: number
  team_id: number
  hackathon_id: number
  captain_id: string
  participant_id: string
  status: string
  requested_by: string
  created_at: string
  updated_at: string
}
