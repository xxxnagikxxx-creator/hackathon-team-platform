import { useNavigate } from 'react-router-dom'
import styles from "./HackatonCard.module.scss"

type HackatonProps = {
  id?: number,
  src: string,
  title: string,
  startDate: string,
  endDate: string,
  onParticipate?: () => void
}

export const HackatonCard = ({ id, src, title, startDate, endDate, onParticipate }: HackatonProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (id) {
      navigate(`/hackatons/${id}`)
    }
  }

  const handleParticipate = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onParticipate) {
      onParticipate()
    } else if (id) {
      navigate(`/hackatons/${id}`)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <article 
      className={styles.hackatonCard__wrapper}
      onClick={handleClick}
    >
      <div className={styles.hackatonCard__imageWrapper}>
        <img 
          className={styles.hackatonCard__img}
          src={src}
          alt={title} 
        />
      </div>
      
      <div className={styles.hackatonCard__content}>
        <h5 className={styles.hackatonCard__title}>{title}</h5>
        
        <div className={styles.hackatonCard__dates}>
          <div className={styles.hackatonCard__dateItem}>
            <span className={styles.hackatonCard__dateLabel}>Начало:</span>
            <span className={styles.hackatonCard__dateValue}>{formatDate(startDate)}</span>
          </div>
          <div className={styles.hackatonCard__dateItem}>
            <span className={styles.hackatonCard__dateLabel}>Окончание:</span>
            <span className={styles.hackatonCard__dateValue}>{formatDate(endDate)}</span>
          </div>
        </div>

        <button 
          className={styles.hackatonCard__participateBtn}
          onClick={handleParticipate}
        >
          Участвовать
        </button>
      </div>
    </article>
  )
}