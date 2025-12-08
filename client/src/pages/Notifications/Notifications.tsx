import { useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationService } from '../../entities/Notification'
import { NotificationItem } from '../../widgets/NotificationItem'
import styles from './Notifications.module.scss'

export const Notifications = () => {
  useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getAll(),
  })

  if (isLoading) {
    return (
      <div className={styles.notifications__loading}>
        <div className={styles.notifications__spinner}></div>
        <p>Загрузка уведомлений...</p>
      </div>
    )
  }

  return (
    <div className={styles.notifications}>
      <div className={styles.notifications__header}>
        
      </div>

      {notifications && notifications.length > 0 ? (
        <div className={styles.notifications__list}>
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              style={{ animationDelay: `${index * 0.05}s` }}
              className={styles.notifications__item}
            >
              <NotificationItem
                notification={notification}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.notifications__empty}>
          <p>У вас нет уведомлений</p>
        </div>
      )}
    </div>
  )
}
