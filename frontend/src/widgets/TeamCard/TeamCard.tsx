import { useNavigate } from 'react-router-dom'
import styles from './TeamCard.module.scss'
import type { Team } from '../../entities/Team/model/team'

type TeamCardProps = {
  team: Team
}

export const TeamCard = ({ team }: TeamCardProps) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/teams/${team.id}`)
  }

  return (
    <article 
      className={styles.teamCard}
      onClick={handleClick}
    >
      <div className={styles.teamCard__header}>
        <h3 className={styles.teamCard__name}>{team.name}</h3>
        <span className={styles.teamCard__info}>
          {team.members.length} {team.maxMembers ? `/ ${team.maxMembers}` : ''} участников
        </span>
      </div>

      {team.members && team.members.length > 0 && (
        <div className={styles.teamCard__members}>
          <div className={styles.teamCard__membersList}>
            {team.members.slice(0, 4).map((member) => (
              <div key={member.id} className={styles.teamCard__member}>
                <img 
                  src={member.avatarUrl || 'https://via.placeholder.com/40'} 
                  alt={member.name}
                  className={styles.teamCard__memberAvatar}
                />
                <span className={styles.teamCard__memberName}>{member.name}</span>
              </div>
            ))}
            {team.members.length > 4 && (
              <div className={styles.teamCard__moreMembers}>
                +{team.members.length - 4}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.teamCard__footer}>
        <span className={styles.teamCard__viewDetails}>Подробнее →</span>
      </div>
    </article>
  )
}

