import { useMutation, useQueryClient } from '@tanstack/react-query'
import { teamService } from '../../entities/Team'
import type { InviteMemberDto } from '../../entities/Team'
import styles from './InviteMember.module.scss'

type InviteMemberProps = {
  teamId: number
  participantId: number
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export const InviteMember = ({ teamId, participantId, onSuccess, onError }: InviteMemberProps) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: InviteMemberDto) => teamService.inviteMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      onSuccess?.()
    },
    onError: (error) => {
      onError?.(error as Error)
    },
  })

  const handleInvite = () => {
    mutation.mutate({ teamId, participantId })
  }

  return (
    <button
      onClick={handleInvite}
      disabled={mutation.isPending}
      className={styles.inviteMember}
    >
      {mutation.isPending ? (
        <>
          <span className={styles.inviteMember__spinner}></span>
          Отправка...
        </>
      ) : (
        'Пригласить в команду'
      )}
    </button>
  )
}
