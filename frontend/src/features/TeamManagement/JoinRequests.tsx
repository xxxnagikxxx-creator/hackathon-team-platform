import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamService } from '../../entities/Team'
import { participantService } from '../../entities/Participant'
import { ParticipantCard } from '../../widgets/ParticipantCard'
import styles from './JoinRequests.module.scss'

type JoinRequestsProps = {
  teamId: number
}

export const JoinRequests = ({ teamId }: JoinRequestsProps) => {
  const queryClient = useQueryClient()

  const { data: invitations, isLoading, refetch } = useQuery({
    queryKey: ['team-invitations', teamId],
    queryFn: () => teamService.getTeamInvitations(teamId),
    enabled: !!teamId,
  })

  const approveMutation = useMutation({
    mutationFn: (invitationId: number) => teamService.approveJoinRequest(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] })
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })

  const declineMutation = useMutation({
    mutationFn: (invitationId: number) => teamService.declineInvitation(invitationId),
    onSuccess: async () => {
      // Инвалидируем кэш и принудительно обновляем данные
      await queryClient.invalidateQueries({ queryKey: ['team-invitations', teamId] })
      await queryClient.invalidateQueries({ queryKey: ['team', teamId] })
      // Принудительно обновляем данные
      await refetch()
    },
    onError: (error: any) => {
      console.error('Ошибка отклонения заявки:', error)
      alert(error?.response?.data?.detail || 'Ошибка при отклонении заявки')
    },
  })

  // Фильтруем только pending запросы от участников (requestedBy === 'participant')
  const pendingJoinRequests = invitations?.filter(
    inv => inv.status === 'pending' && inv.requestedBy === 'participant'
  ) || []

  if (isLoading) {
    return (
      <div className={styles.joinRequests}>
        <div className={styles.joinRequests__loading}>Загрузка заявок...</div>
      </div>
    )
  }

  if (pendingJoinRequests.length === 0) {
    return (
      <div className={styles.joinRequests}>
        <h3 className={styles.joinRequests__title}>Заявки на вступление</h3>
        <p className={styles.joinRequests__empty}>Нет активных заявок на вступление</p>
      </div>
    )
  }

  return (
    <div className={styles.joinRequests}>
      <h3 className={styles.joinRequests__title}>
        Заявки на вступление ({pendingJoinRequests.length})
      </h3>
      <div className={styles.joinRequests__list}>
        {pendingJoinRequests.map((request) => (
          <JoinRequestItem
            key={request.invitationId}
            request={request}
            onApprove={() => approveMutation.mutate(request.invitationId)}
            onDecline={() => {
              if (confirm('Вы уверены, что хотите отклонить эту заявку?')) {
                declineMutation.mutate(request.invitationId)
              }
            }}
            isApproving={approveMutation.isPending}
            isDeclining={declineMutation.isPending}
          />
        ))}
      </div>
    </div>
  )
}

type JoinRequestItemProps = {
  request: {
    invitationId: number
    participantId: string
    createdAt: string
  }
  onApprove: () => void
  onDecline: () => void
  isApproving: boolean
  isDeclining: boolean
}

const JoinRequestItem = ({ request, onApprove, onDecline, isApproving, isDeclining }: JoinRequestItemProps) => {
  const { data: participant } = useQuery({
    queryKey: ['participant', request.participantId],
    queryFn: () => participantService.getById(request.participantId),
    enabled: !!request.participantId,
  })

  if (!participant) {
    return (
      <div className={styles.joinRequestItem}>
        <div className={styles.joinRequestItem__loading}>Загрузка участника...</div>
      </div>
    )
  }

  return (
    <div className={styles.joinRequestItem}>
      <div className={styles.joinRequestItem__participant}>
        <ParticipantCard
          id={participant.id}
          name={participant.name}
          src={participant.avatarUrl || ''}
          role={participant.role}
          skills={participant.skills}
          tgTag={participant.tgTag}
        />
      </div>
      <div className={styles.joinRequestItem__info}>
        <p className={styles.joinRequestItem__date}>
          Заявка отправлена: {new Date(request.createdAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      <div className={styles.joinRequestItem__actions}>
        <button
          onClick={onApprove}
          disabled={isApproving || isDeclining}
          className={styles.joinRequestItem__approveButton}
        >
          {isApproving ? 'Одобрение...' : 'Одобрить'}
        </button>
        <button
          onClick={onDecline}
          disabled={isApproving || isDeclining}
          className={styles.joinRequestItem__declineButton}
        >
          {isDeclining ? 'Отклонение...' : 'Отклонить'}
        </button>
      </div>
    </div>
  )
}
