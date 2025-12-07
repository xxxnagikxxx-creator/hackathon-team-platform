import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamService } from '../../entities/Team'
import { hackathonService } from '../../entities/Hackathon'
import { ParticipantCard } from '../../widgets/ParticipantCard'
import { JoinRequests } from '../../features/TeamManagement'
import { useUser } from '../../app/providers/UserProvider'
import styles from './TeamDetail.module.scss'
import arrowIcon from '../../shared/assets/icons/arrow.svg'

export const TeamDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => {
      console.log('TeamDetail: Loading team with id:', id)
      return teamService.getById(Number(id))
    },
    enabled: !!id,
  })

  // Загружаем хакатон, если есть hackathonId
  const { data: hackathon } = useQuery({
    queryKey: ['hackathon', team?.hackathonId],
    queryFn: () => hackathonService.getById(team!.hackathonId!),
    enabled: !!team?.hackathonId,
  })

  // Инициализируем данные при загрузке команды
  useEffect(() => {
    if (team && !isEditing) {
      setTitle(team.title || '')
      setDescription(team.description || '')
    }
  }, [team, isEditing])

  const updateTeamMutation = useMutation({
    mutationFn: (data: { title: string; description: string }) => 
      teamService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      setIsEditing(false)
    },
  })

  const leaveTeamMutation = useMutation({
    mutationFn: () => teamService.leaveTeam(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      navigate('/teams')
    },
    onError: (error: any) => {
      console.error('Ошибка выхода из команды:', error)
      alert(error?.response?.data?.detail || 'Ошибка при выходе из команды')
    },
  })

  const removeParticipantMutation = useMutation({
    mutationFn: (participantId: string | number) => teamService.removeParticipant(Number(id), participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
    },
    onError: (error: any) => {
      console.error('Ошибка удаления участника:', error)
      alert(error?.response?.data?.detail || 'Ошибка при удалении участника')
    },
  })

  const deleteTeamMutation = useMutation({
    mutationFn: () => teamService.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      // Сохраняем hackathonId перед удалением
      const hackathonId = team?.hackathonId
      // Перенаправляем на страницу хакатона, если он есть, иначе на список команд
      if (hackathonId) {
        navigate(`/hackatons/${hackathonId}`)
      } else {
        navigate('/teams')
      }
    },
    onError: (error: any) => {
      console.error('Ошибка удаления команды:', error)
      alert(error?.response?.data?.detail || 'Ошибка при удалении команды')
    },
  })

  const handleSave = () => {
    if (team && title.trim()) {
      updateTeamMutation.mutate({
        title: title.trim(),
        description: description.trim() || '',
      })
    }
  }

  const handleCancelEdit = () => {
    if (team) {
      setTitle(team.title || '')
      setDescription(team.description || '')
    }
    setIsEditing(false)
  }

  const handleStartEdit = () => {
    if (team) {
      setTitle(team.title || '')
      setDescription(team.description || '')
      setIsEditing(true)
    }
  }

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

  // Объединяем капитана и участников
  const allMembers = [team.captain, ...team.participants]
  // Проверяем, является ли пользователь капитаном или участником
  const isCaptain = team.captain.id === user?.id
  const isMember = allMembers.some(m => m.id === user?.id)
  const canLeave = isMember && !isCaptain && allMembers.length > 1

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
        <div className={styles.teamDetail__headerTop}>
          <div className={styles.teamDetail__headerMain}>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={styles.teamDetail__titleInput}
                  placeholder="Название команды"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.teamDetail__descriptionTextarea}
                  placeholder="Введите описание команды"
                  rows={4}
                />
                <div className={styles.teamDetail__editActions}>
                  <button
                    onClick={handleSave}
                    disabled={updateTeamMutation.isPending || !title.trim()}
                    className={styles.teamDetail__saveButton}
                  >
                    {updateTeamMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={updateTeamMutation.isPending}
                    className={styles.teamDetail__cancelButton}
                  >
                    Отмена
                  </button>
                </div>
              </>
            ) : (
              <>
        <h1 className={styles.teamDetail__title}>{team.title}</h1>
                {hackathon && (
                  <div className={styles.teamDetail__hackathon}>
                    <span className={styles.teamDetail__hackathonLabel}>Хакатон:</span>
                    <span 
                      className={styles.teamDetail__hackathonName}
                      onClick={() => navigate(`/hackatons/${hackathon.id}`)}
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {hackathon.title}
                    </span>
                  </div>
                )}
                <div className={styles.teamDetail__descriptionContainer}>
                  {team.description ? (
          <p className={styles.teamDetail__description}>{team.description}</p>
                  ) : (
                    <p className={styles.teamDetail__descriptionEmpty}>Описание отсутствует</p>
                  )}
                </div>
              </>
        )}
          </div>
          {isCaptain && !isEditing && (
            <button
              onClick={handleStartEdit}
              className={styles.teamDetail__editButton}
            >
              Редактировать
          </button>
        )}
        </div>
      </div>

      <div className={styles.teamDetail__info}>
        <div className={styles.teamDetail__infoItem}>
          <span className={styles.teamDetail__infoLabel}>Участников:</span>
          <span className={styles.teamDetail__infoValue}>
            {allMembers.length}
          </span>
        </div>
      </div>

      <div className={styles.teamDetail__members}>
        <h2 className={styles.teamDetail__membersTitle}>Состав команды</h2>
        {allMembers && allMembers.length > 0 ? (
          <div className={styles.teamDetail__membersGrid}>
            {/* Капитан */}
            <div key={team.captain.id} className={`${styles.teamDetail__memberCard} ${styles.teamDetail__memberCard_captain}`}>
              <ParticipantCard
                id={team.captain.id}
                name={team.captain.name}
                src={team.captain.avatarUrl || ''}
                role={team.captain.role}
                skills={team.captain.skills}
                tgTag={team.captain.tgTag}
              />
              <span className={styles.teamDetail__captainBadge}>Капитан</span>
            </div>
            {/* Участники */}
            {team.participants.map((member) => (
              <div key={member.id} className={styles.teamDetail__memberCard}>
                <ParticipantCard
                  id={member.id}
                  name={member.name}
                  src={member.avatarUrl || ''}
                  role={member.role}
                  skills={member.skills}
                  tgTag={member.tgTag}
                />
                {isCaptain && (
                  <button
                    className={styles.teamDetail__removeMember}
                    onClick={() => {
                      if (confirm(`Вы уверены, что хотите удалить ${member.name} из команды?`)) {
                        // Используем tgTag (telegram_id), так как это идентификатор на backend
                        const participantId = member.tgTag || String(member.id)
                        removeParticipantMutation.mutate(participantId)
                      }
                    }}
                    disabled={removeParticipantMutation.isPending}
                  >
                    {removeParticipantMutation.isPending ? 'Удаление...' : 'Удалить из команды'}
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

      {/* Заявки на вступление (только для капитана) */}
      {isCaptain && team && (
        <JoinRequests teamId={team.id} />
      )}

      <div className={styles.teamDetail__actions}>
        {isCaptain && (
          <button
            onClick={() => {
              if (confirm('Вы уверены, что хотите удалить команду? Это действие необратимо и все участники будут удалены из команды.')) {
                deleteTeamMutation.mutate()
              }
            }}
            disabled={deleteTeamMutation.isPending || leaveTeamMutation.isPending}
            className={styles.teamDetail__deleteButton}
          >
            {deleteTeamMutation.isPending ? 'Удаление...' : 'Удалить команду'}
          </button>
        )}
      {canLeave && (
          <button
            onClick={() => {
              if (confirm('Вы уверены, что хотите покинуть команду?')) {
                leaveTeamMutation.mutate()
              }
            }}
            disabled={leaveTeamMutation.isPending || deleteTeamMutation.isPending}
            className={styles.teamDetail__leaveButton}
          >
            {leaveTeamMutation.isPending ? 'Покидание...' : 'Покинуть команду'}
          </button>
        )}
        </div>
    </div>
  )
}

