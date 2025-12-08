import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamService } from '../../entities/Team'
import { ParticipantCard } from '../../widgets/ParticipantCard'
import { useUser } from '../../app/providers/UserProvider'
// import { LeaveTeam } from '../../features/TeamManagement/LeaveTeam'
import styles from './TeamDetail.module.scss'
import arrowIcon from '../../shared/assets/icons/arrow.svg'

export const TeamDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const queryClient = useQueryClient()

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getById(Number(id)),
    enabled: !!id,
  })

  const leaveTeamMutation = useMutation({
    mutationFn: () => teamService.leaveTeam(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      navigate('/teams')
    },
  })

  if (isLoading) {
    return (
      <div className={styles.teamDetail__loading}>
        <div className={styles.teamDetail__spinner}></div>
        <p>Загрузка команды...</p>
      </div>
    )
  }

  if (!team) {
    return (
      <div className={styles.teamDetail__error}>
        <p>Команда не найдена</p>
        <button onClick={() => navigate('/teams')} className={styles.teamDetail__backButton}>
          Вернуться к списку
        </button>
      </div>
    )
  }

  const isCaptain = team.members.some(m => m.id === user?.id && m.role === 'captain')
  const isMember = team.members.some(m => m.id === user?.id)
  const canLeave = isMember && !isCaptain && team.members.length > 1

  return (
    <div className={styles.teamDetail}>
      <button
        onClick={() => navigate('/teams')}
        className={styles.teamDetail__backButton}
      >
        <img src={arrowIcon} alt="Назад" className={styles.teamDetail__backIcon} />
        <span>Назад</span>
      </button>

      <div className={styles.teamDetail__header}>
        <h1 className={styles.teamDetail__title}>{team.name}</h1>
        {isCaptain && (
          <button className={styles.teamDetail__editButton}>
            Редактировать команду
          </button>
        )}
      </div>

      <div className={styles.teamDetail__info}>
        <div className={styles.teamDetail__infoItem}>
          <span className={styles.teamDetail__infoLabel}>Участников:</span>
          <span className={styles.teamDetail__infoValue}>
            {team.members.length} {team.maxMembers ? `/ ${team.maxMembers}` : ''}
          </span>
        </div>
      </div>

      <div className={styles.teamDetail__members}>
        <h2 className={styles.teamDetail__membersTitle}>Состав команды</h2>
        {team.members && team.members.length > 0 ? (
          <div className={styles.teamDetail__membersGrid}>
            {team.members.map((member) => (
              <div key={member.id} className={styles.teamDetail__memberCard}>
                <ParticipantCard
                  id={member.id}
                  name={member.name}
                  src={member.avatarUrl || ''}
                  role={member.role}
                  skills={member.skills}
                  tgTag={member.tgTag}
                />
                {isCaptain && member.id !== user?.id && (
                  <button
                    className={styles.teamDetail__removeMember}
                    onClick={() => {
                      // TODO: Реализовать удаление участника
                      alert('Функция удаления участника будет реализована')
                    }}
                  >
                    Удалить из команды
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.teamDetail__empty}>
            <p>В команде пока нет участников</p>
          </div>
        )}
      </div>

      {canLeave && (
        <div className={styles.teamDetail__actions}>
          <button
            onClick={() => {
              if (confirm('Вы уверены, что хотите покинуть команду?')) {
                leaveTeamMutation.mutate()
              }
            }}
            disabled={leaveTeamMutation.isPending}
            className={styles.teamDetail__leaveButton}
          >
            {leaveTeamMutation.isPending ? 'Покидание...' : 'Покинуть команду'}
          </button>
        </div>
      )}
    </div>
  )
}

