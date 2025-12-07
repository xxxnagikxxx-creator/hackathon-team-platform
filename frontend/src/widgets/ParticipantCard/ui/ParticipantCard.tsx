import { useNavigate } from 'react-router-dom'
import styles from "./ParticipantCard.module.scss"

export type ParticipantProps = {
  id?: number,
  name: string,
  src: string,
  role: string,
  skills?: string[],
  bio?: string,
  tgTag?: string,
}

export const ParticipantCard = ({
  id, 
  src, 
  name, 
  role, 
  skills,
  bio,
  tgTag,
}: ParticipantProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (id) {
      navigate(`/participants/${id}`)
    }
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
        
        {tgTag && (
          <a
            href={`https://t.me/${tgTag}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.participant__telegram}
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.participant__telegramIcon}>
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
            </svg>
            @{tgTag}
          </a>
        )}
        
        <div className={styles.participant__stack}>
          {skills && skills.length > 0 ? (
            skills.slice(0, 8).map((skill, index) => (
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

        {bio && bio.trim() !== '' && (
          <div className={styles.participant__bio}>
            <p className={styles.participant__bioText}>{bio}</p>
          </div>
        )}
      </div>
    </article>
  )
}