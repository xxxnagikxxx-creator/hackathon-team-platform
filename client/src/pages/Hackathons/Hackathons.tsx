import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HackatonCard } from '../../widgets/HackatonCard'
import { hackathonService } from '../../entities/Hackathon'
import { CreateHackathon } from '../../features/HackathonManagement/CreateHackathon'
import { useUser } from '../../app/providers/UserProvider'
import styles from './Hackathons.module.scss'

export const Hackatons = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const navigate = useNavigate()
  const { user } = useUser()
  const isOrganizer = user?.role === 'organizer' // Предполагаем, что есть поле role

  const { data: hackathons, isLoading } = useQuery({
    queryKey: ['hackathons'],
    queryFn: () => hackathonService.getAll(),
  })

  if (isLoading) {
    return (
      <div className={styles.hackatons__loading}>
        <div className={styles.hackatons__spinner}></div>
        <p>Загрузка хакатонов...</p>
      </div>
    )
  }

  return (
    <div className={styles.hackatons__wrapper}>
      <div className={styles.hackatons__top}>
        <h2 className={styles.hackatons__title}>Хакатоны</h2>
        {isOrganizer && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={styles.hackatons__createButton}
          >
            {showCreateForm ? 'Отмена' : '+ Создать хакатон'}
          </button>
        )}
      </div>

      {showCreateForm && isOrganizer && (
        <div className={styles.hackatons__createForm}>
          <CreateHackathon
            onSuccess={() => {
              setShowCreateForm(false)
            }}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      <div className={styles.hackatons__section}>
        <section className={styles.hackatons__list}>
          {hackathons && hackathons.length > 0 ? (
            hackathons.map((hackathon, index) => (
              <div
                key={hackathon.id}
                style={{ animationDelay: `${index * 0.05}s` }}
                className={styles.hackatons__cardWrapper}
              >
                <HackatonCard
                  id={hackathon.id}
                  src={hackathon.imageUrl}
                  title={hackathon.title}
                  startDate={hackathon.startDate}
                  endDate={hackathon.endDate}
                  onParticipate={() => {
                    if (hackathon.id) {
                      navigate(`/hackatons/${hackathon.id}`)
                    }
                  }}
                />
              </div>
            ))
          ) : (
            <div className={styles.hackatons__empty}>
              <p>Хакатоны не найдены</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
