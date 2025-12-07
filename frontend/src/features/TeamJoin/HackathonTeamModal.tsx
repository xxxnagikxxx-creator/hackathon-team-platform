import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamService } from '../../entities/Team'
import { useNavigate } from 'react-router-dom'
import styles from './HackathonTeamModal.module.scss'
import closeIcon from '../../shared/assets/icons/closeicon.png'

type HackathonTeamModalProps = {
  hackathonId: number
  onClose: () => void
}

export const HackathonTeamModal = ({ hackathonId, onClose }: HackathonTeamModalProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select')
  const [teamTitle, setTeamTitle] = useState('')
  const [teamDescription, setTeamDescription] = useState('')

  // Получаем команды для этого хакатона
  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams', hackathonId],
    queryFn: () => teamService.getAll(hackathonId),
    enabled: mode === 'join',
  })

  // Мутация для создания команды
  const createTeamMutation = useMutation({
    mutationFn: () => teamService.create({
      title: teamTitle,
      description: teamDescription || null,
      hackathonId,
    }),
    onSuccess: (createdTeam) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      onClose()
      navigate(`/teams/${createdTeam.id}`)
    },
    onError: (error: any) => {
      alert(error?.response?.data?.detail || 'Ошибка при создании команды')
    },
  })

  const handleCreateTeam = () => {
    if (!teamTitle.trim()) {
      alert('Введите название команды')
      return
    }

    createTeamMutation.mutate()
  }

  // Мутация для отправки запроса на вступление
  const requestJoinMutation = useMutation({
    mutationFn: (teamId: number) => teamService.requestJoinTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathonId] })
      alert('Запрос на вступление отправлен! Капитан команды получит уведомление.')
      onClose()
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Ошибка при отправке запроса на вступление'
      alert(errorMessage)
    },
  })

  const handleJoinTeam = (teamId: number) => {
    requestJoinMutation.mutate(teamId)
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modal__wrapper} onClick={(e) => e.stopPropagation()}>
        <img
          src={closeIcon}
          alt="закрыть"
          className={styles.modal__closeBtn}
          onClick={onClose}
        />

        {mode === 'select' && (
          <div className={styles.modal__content}>
            <h3 className={styles.modal__title}>Присоединиться к хакатону</h3>
            <p className={styles.modal__description}>
              Чтобы участвовать в хакатоне, вам нужно создать команду или вступить в существующую
            </p>
            <div className={styles.modal__actions}>
              <button
                onClick={() => setMode('create')}
                className={`${styles.modal__button} ${styles.modal__button_primary}`}
              >
                Создать команду
              </button>
              <button
                onClick={() => setMode('join')}
                className={`${styles.modal__button} ${styles.modal__button_secondary}`}
              >
                Вступить в команду
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div className={styles.modal__content}>
            <h3 className={styles.modal__title}>Создать команду</h3>
            <div className={styles.modal__form}>
              <label className={styles.modal__label}>
                Название команды <span className={styles.modal__required}>*</span>
              </label>
              <input
                type="text"
                value={teamTitle}
                onChange={(e) => setTeamTitle(e.target.value)}
                className={styles.modal__input}
                placeholder="Введите название команды"
                required
              />
              <label className={styles.modal__label}>Описание команды</label>
              <textarea
                value={teamDescription}
                onChange={(e) => setTeamDescription(e.target.value)}
                className={styles.modal__textarea}
                placeholder="Опишите вашу команду"
                rows={4}
              />
              <div className={styles.modal__formActions}>
                <button
                  onClick={handleCreateTeam}
                  disabled={createTeamMutation.isPending || !teamTitle.trim()}
                  className={`${styles.modal__button} ${styles.modal__button_primary}`}
                >
                  {createTeamMutation.isPending ? 'Создание...' : 'Создать команду'}
                </button>
                <button
                  onClick={() => setMode('select')}
                  className={`${styles.modal__button} ${styles.modal__button_secondary}`}
                >
                  Назад
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className={styles.modal__content}>
            <h3 className={styles.modal__title}>Вступить в команду</h3>
            {isLoadingTeams ? (
              <div className={styles.modal__loading}>Загрузка команд...</div>
            ) : teams && teams.length > 0 ? (
              <div className={styles.modal__teamsList}>
                {teams.map((team) => (
                  <div key={team.id} className={styles.modal__teamItem}>
                    <div className={styles.modal__teamInfo}>
                      <h4 className={styles.modal__teamTitle}>{team.title}</h4>
                      {team.description && (
                        <p className={styles.modal__teamDescription}>{team.description}</p>
                      )}
                      <div className={styles.modal__teamMeta}>
                        <span>Капитан: {team.captain.name}</span>
                        <span>Участников: {team.participants.length + 1}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinTeam(team.id)}
                      className={styles.modal__joinButton}
                      disabled={requestJoinMutation.isPending}
                    >
                      {requestJoinMutation.isPending ? 'Отправка...' : 'Отправить запрос'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.modal__empty}>
                <p>Команды для этого хакатона не найдены</p>
                <button
                  onClick={() => setMode('create')}
                  className={styles.modal__button}
                >
                  Создать команду
                </button>
              </div>
            )}
            <div className={styles.modal__formActions}>
              <button
                onClick={() => setMode('select')}
                className={`${styles.modal__button} ${styles.modal__button_secondary}`}
              >
                Назад
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
