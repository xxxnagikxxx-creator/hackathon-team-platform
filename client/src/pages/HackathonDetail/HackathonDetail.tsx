import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { hackathonService } from '../../entities/Hackathon'
import { useUser } from '../../app/providers/UserProvider'
// import { EditHackaton } from '../../features/HackathonManagement/EditHackaton'
import { useState } from 'react'
import styles from './HackathonDetail.module.scss'
import arrowIcon from '../../shared/assets/icons/arrow.svg'

export const HackathonDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const isOrganizer = user?.role === 'organizer'

  const { data: hackathon, isLoading } = useQuery({
    queryKey: ['hackathon', id],
    queryFn: () => hackathonService.getById(Number(id)),
    enabled: !!id,
  })

  const participateMutation = useMutation({
    mutationFn: () => hackathonService.participate(Number(id)),
    onSuccess: () => {
      alert('Вы успешно присоединились к хакатону!')
    },
    onError: (error: any) => {
      alert(error?.message || 'Ошибка при присоединении к хакатону')
    },
  })

  if (isLoading) {
    return (
      <div className={styles.hackathonDetail__loading}>
        <div className={styles.hackathonDetail__spinner}></div>
        <p>Загрузка хакатона...</p>
      </div>
    )
  }

  if (!hackathon) {
    return (
      <div className={styles.hackathonDetail__error}>
        <p>Хакатон не найден</p>
        <button onClick={() => navigate('/hackatons')} className={styles.hackathonDetail__backButton}>
          Вернуться к списку
        </button>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={styles.hackathonDetail}>
      <button
        onClick={() => navigate('/hackatons')}
        className={styles.hackathonDetail__backButton}
      >
        <img src={arrowIcon} alt="Назад" className={styles.hackathonDetail__backIcon} />
        <span>Назад</span>
      </button>

      <div className={styles.hackathonDetail__content}>
        <div className={styles.hackathonDetail__imageWrapper}>
          <img
            src={hackathon.imageUrl}
            alt={hackathon.title}
            className={styles.hackathonDetail__image}
          />
        </div>

        <div className={styles.hackathonDetail__info}>
          <div className={styles.hackathonDetail__header}>
            <h1 className={styles.hackathonDetail__title}>{hackathon.title}</h1>
            {isOrganizer && (
              <button
                onClick={() => setIsEditing(true)}
                className={styles.hackathonDetail__editButton}
              >
                Редактировать хакатон
              </button>
            )}
          </div>

          {!isEditing && (
            <>
              <div className={styles.hackathonDetail__meta}>
            {hackathon.location && (
              <div className={styles.hackathonDetail__metaItem}>
                <span className={styles.hackathonDetail__metaLabel}>Место проведения:</span>
                <span className={styles.hackathonDetail__metaValue}>{hackathon.location}</span>
              </div>
            )}
            <div className={styles.hackathonDetail__metaItem}>
              <span className={styles.hackathonDetail__metaLabel}>Начало:</span>
              <span className={styles.hackathonDetail__metaValue}>{formatDate(hackathon.startDate)}</span>
            </div>
            <div className={styles.hackathonDetail__metaItem}>
              <span className={styles.hackathonDetail__metaLabel}>Окончание:</span>
              <span className={styles.hackathonDetail__metaValue}>{formatDate(hackathon.endDate)}</span>
            </div>
            {hackathon.maxParticipants && (
              <div className={styles.hackathonDetail__metaItem}>
                <span className={styles.hackathonDetail__metaLabel}>Максимум участников:</span>
                <span className={styles.hackathonDetail__metaValue}>{hackathon.maxParticipants}</span>
              </div>
            )}
          </div>

              <div className={styles.hackathonDetail__description}>
                <h2 className={styles.hackathonDetail__descriptionTitle}>Описание</h2>
                <p className={styles.hackathonDetail__descriptionText}>{hackathon.description}</p>
              </div>

              {user && !isOrganizer && (
                <div className={styles.hackathonDetail__actions}>
                  <button
                    onClick={() => participateMutation.mutate()}
                    disabled={participateMutation.isPending}
                    className={styles.hackathonDetail__participateButton}
                  >
                    {participateMutation.isPending ? 'Присоединение...' : 'Присоединиться'}
                  </button>
                </div>
              )}
            </>
          )}

          {isEditing && isOrganizer && (
            <div>
              {/* TODO: Реализовать компонент EditHackaton */}
              <p>Редактирование хакатона будет реализовано</p>
              <button onClick={() => setIsEditing(false)}>Отмена</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


