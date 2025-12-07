// Примечание: Endpoint для приглашения участников не существует на бэке
// Вместо этого используется POST /teams/{team_id}/enter с паролем
// Этот компонент можно использовать для входа в команду по паролю

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { teamService } from '../../entities/Team'
import type { EnterTeamDto } from '../../entities/Team'
import styles from './InviteMember.module.scss'

type InviteMemberProps = {
  teamId: number
  password: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export const InviteMember = ({ teamId, password, onSuccess, onError }: InviteMemberProps) => {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: EnterTeamDto) => teamService.enterTeam(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
      onSuccess?.()
    },
    onError: (error) => {
      onError?.(error as Error)
    },
  })

  const handleInvite = () => {
    mutation.mutate({ password })
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
          Вход в команду...
        </>
      ) : (
        'Войти в команду'
      )}
    </button>
  )
}
