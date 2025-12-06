import type { Notification } from '../../entities/Notification'
import styles from './Notification.module.scss'

type NotificationItemProps = {
  notification: Notification
}

export const NotificationItem = ({ notification}: NotificationItemProps) => {
  return (
    <div className={`${styles.notification} `}>
      <div className={styles.notification__content}>
        <h4 className={styles.notification__title}>Приглашение в команду</h4>
        <p className={styles.notification__message}>{`Вас пригласил в команду ${notification.commandName} пользователь: `} <a href={notification.tgTag}>{notification.name}</a></p>
        <span className={styles.notification__date}>
          {new Date(notification.createdAt).toLocaleString('ru-RU')}
        </span>
      </div>
    </div>
  )
}

