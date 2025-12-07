import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { participantService } from '../../entities/Participant'
import { ProfileEditForm } from '../../features/ProfileEdit/ProfileEditForm'
import { useUser } from '../../app/providers/UserProvider'
import styles from './ParticipantDetail.module.scss'
import arrowIcon from '../../shared/assets/icons/arrow.svg'

export const ParticipantDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { telegramId, isAuthenticated } = useUser()
  const [isEditing, setIsEditing] = useState(false)

  const { data: participant, isLoading, error } = useQuery({
    queryKey: ['participant', id],
    queryFn: () => participantService.getById(id || ''),
    enabled: !!id,
  })

  // Проверяем, является ли текущий пользователь владельцем профиля
  const isOwner = isAuthenticated && (id === telegramId || id === String(telegramId))


  if (isLoading) {
    return (
      <div className={styles.participantDetail__loading}>
        <div className={styles.participantDetail__spinner}></div>
        <p>Загрузка участника...</p>
      </div>
    )
  }

  if (error || !participant) {
    const errorMessage = error?.response?.status === 404 
      ? 'Участник не найден. Возможно, вы еще не зарегистрированы в системе. Пожалуйста, зарегистрируйтесь через Telegram бота.'
      : 'Ошибка загрузки данных участника'
    
    return (
      <div className={styles.participantDetail__error}>
        <p>{errorMessage}</p>
        <button onClick={() => navigate('/participants')} className={styles.participantDetail__backButton}>
          Вернуться к списку
        </button>
      </div>
    )
  }

  if (isEditing && isOwner) {
    return (
      <div className={styles.participantDetail}>
        <div className={styles.participantDetail__headerActions}>
          <button
            onClick={() => navigate('/participants')}
            className={styles.participantDetail__backButton}
          >
            <img src={arrowIcon} alt="Назад" className={styles.participantDetail__backIcon} />
            <span>Назад</span>
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className={styles.participantDetail__cancelButton}
          >
            Отменить редактирование
          </button>
        </div>
        <ProfileEditForm 
          participantId={id ? parseInt(id) : undefined}
          onSuccess={() => {
            setIsEditing(false)
            // Обновляем данные участника
            window.location.reload()
          }}
        />
      </div>
    )
  }

  return (
    <div className={styles.participantDetail}>
      <div className={styles.participantDetail__headerActions}>
        <button
          onClick={() => navigate('/participants')}
          className={styles.participantDetail__backButton}
        >
          <img src={arrowIcon} alt="Назад" className={styles.participantDetail__backIcon} />
          <span>Назад</span>
        </button>
        {isOwner && isAuthenticated && (
          <button
            onClick={() => setIsEditing(true)}
            className={styles.participantDetail__editButton}
          >
            Редактировать профиль
          </button>
        )}
      </div>

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
            <p className={styles.participantDetail__role}>{participant.role || 'Роль не указана'}</p>
            {participant.tgTag && (
              <a
                href={`https://t.me/${participant.tgTag}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.participantDetail__telegram}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={styles.participantDetail__telegramIcon}>
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
                @{participant.tgTag}
              </a>
            )}
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

      </div>
    </div>
  )
}


