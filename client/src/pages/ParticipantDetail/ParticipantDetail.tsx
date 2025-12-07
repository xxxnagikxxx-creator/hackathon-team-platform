import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { participantService } from '../../entities/Participant'
import { teamService } from '../../entities/Team'
import { useState } from 'react'
import styles from './ParticipantDetail.module.scss'
import arrowIcon from '../../shared/assets/icons/arrow.svg'

export const ParticipantDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [showInviteForm, setShowInviteForm] = useState(false)

  const { data: participant, isLoading } = useQuery({
    queryKey: ['participant', id],
    queryFn: () => participantService.getById(Number(id)),
    enabled: !!id,
  })

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getAll(),
  })

  const inviteMutation = useMutation({
    mutationFn: (teamId: number) =>
      teamService.inviteMember({ teamId, participantId: Number(id) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      alert('Приглашение отправлено! Участник получит уведомление.')
      setShowInviteForm(false)
    },
    onError: (error) => {
      alert('Ошибка при отправке приглашения: ' + (error as Error).message)
    },
  })

  if (isLoading) {
    return (
      <div className={styles.participantDetail__loading}>
        <div className={styles.participantDetail__spinner}></div>
        <p>Загрузка участника...</p>
      </div>
    )
  }

  if (!participant) {
    return (
      <div className={styles.participantDetail__error}>
        <p>Участник не найден</p>
        <button onClick={() => navigate('/participants')} className={styles.participantDetail__backButton}>
          Вернуться к списку
        </button>
      </div>
    )
  }

  const handleInvite = () => {
    if (selectedTeamId) {
      inviteMutation.mutate(selectedTeamId)
    }
  }

  return (
    <div className={styles.participantDetail}>
      <button
        onClick={() => navigate('/participants')}
        className={styles.participantDetail__backButton}
      >
        <img src={arrowIcon} alt="Назад" className={styles.participantDetail__backIcon} />
        <span>Назад</span>
      </button>

      <div className={styles.participantDetail__content}>
        <div className={styles.participantDetail__header}>
          <div className={styles.participantDetail__avatarWrapper}>
            <img
              src={participant.avatarUrl || 'https://i.pravatar.cc/150?img=1'}
              alt={participant.name}
              className={styles.participantDetail__avatar}
            />
          </div>
          <div className={styles.participantDetail__headerInfo}>
            <h1 className={styles.participantDetail__name}>{participant.name}</h1>
            <p className={styles.participantDetail__role}>{participant.role}</p>
            <p className={styles.participantDetail__email}>{participant.email}</p>
          </div>
        </div>

        {participant.bio && (
          <div className={styles.participantDetail__section}>
            <h2 className={styles.participantDetail__sectionTitle}>О себе</h2>
            <p className={styles.participantDetail__bio}>{participant.bio}</p>
          </div>
        )}

        <div className={styles.participantDetail__section}>
          <h2 className={styles.participantDetail__sectionTitle}>Навыки</h2>
          <div className={styles.participantDetail__skills}>
            {participant.skills && participant.skills.length > 0 ? (
              participant.skills.map((skill, index) => (
                <span key={index} className={styles.participantDetail__skill}>
                  {skill}
                </span>
              ))
            ) : (
              <p>Навыки не указаны</p>
            )}
          </div>
        </div>

        <div className={styles.participantDetail__section}>
          <h2 className={styles.participantDetail__sectionTitle}>Пригласить в команду</h2>
          {!showInviteForm ? (
            <button
              onClick={() => setShowInviteForm(true)}
              className={styles.participantDetail__inviteButton}
            >
              Пригласить в команду
            </button>
          ) : (
            <div className={styles.participantDetail__inviteForm}>
              {teams && teams.length > 0 ? (
                <>
                  <label className={styles.participantDetail__label}>
                    Выберите команду:
                    <select
                      value={selectedTeamId || ''}
                      onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                      className={styles.participantDetail__select}
                    >
                      <option value="">-- Выберите команду --</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={styles.participantDetail__inviteActions}>
                    <button
                      onClick={handleInvite}
                      disabled={!selectedTeamId || inviteMutation.isPending}
                      className={styles.participantDetail__submitButton}
                    >
                      {inviteMutation.isPending ? 'Отправка...' : 'Отправить приглашение'}
                    </button>
                    <button
                      onClick={() => {
                        setShowInviteForm(false)
                        setSelectedTeamId(null)
                      }}
                      className={styles.participantDetail__cancelButton}
                    >
                      Отмена
                    </button>
                  </div>
                </>
              ) : (
                <p className={styles.participantDetail__noTeams}>
                  У вас пока нет команд. Создайте команду, чтобы пригласить участника.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


