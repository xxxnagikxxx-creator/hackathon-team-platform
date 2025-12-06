import { useNavigate } from 'react-router-dom'
import styles from "./ParticipantCard.module.scss"
import telegramIcon from '../../../shared/assets/icons/telegram.svg'

export type ParticipantProps = {
  id?: number,
  name: string,
  src: string,
  role: string,
  skills?: string[],
  tgTag?: string,
  onInvite?: () => void,
  onRespond?: () => void,
  showActions?: boolean
}

export const ParticipantCard = ({
  id, 
  src, 
  name, 
  role, 
  skills, 
  tgTag,
  onInvite,
  onRespond,
  showActions = false
}: ParticipantProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (id) {
      navigate(`/participants/${id}`)
    }
  }

  const handleTelegram = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (tgTag) {
      window.open(`https://t.me/${tgTag.replace('@', '')}`, '_blank')
    }
  }

  const handleInvite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onInvite?.()
  }

  const handleRespond = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRespond?.()
  }

  return (
    <article 
      className={styles.participant}
      onClick={handleClick}
      style={{ cursor: id ? 'pointer' : 'default' }}
    >
      <div className={styles.participant__avatar}>
        <img 
          src={src || 'https://via.placeholder.com/80'} 
          alt={name} 
          className={styles.participant__img}
        />
      </div>
      
      <div className={styles.participant__content}>
        <h5 className={styles.participant__name}>{name}</h5>
        <p className={styles.participant__role}>{role}</p>        
        
        <div className={styles.participant__stack}>
          {skills && skills.length > 0 ? (
            skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className={styles.participant__stack_tag}
              >
                {skill}
              </span>
            ))
          ) : (
            <span className={styles.participant__noSkills}>Навыки не указаны</span>
          )}
        </div>

        {showActions && (
          <div className={styles.participant__actions}>
            {onRespond && (
              <button
                className={styles.participant__actionBtn}
                onClick={handleRespond}
              >
                Откликнуться
              </button>
            )}
            {onInvite && (
              <button
                className={`${styles.participant__actionBtn} ${styles.participant__actionBtn_primary}`}
                onClick={handleInvite}
              >
                Пригласить в команду
              </button>
            )}
            {tgTag && (
              <button
                className={styles.participant__telegramBtn}
                onClick={handleTelegram}
                title="Написать в Telegram"
              >
                <img src={telegramIcon} alt="Telegram" />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}