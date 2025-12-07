import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { hackathonService } from '../../entities/Hackathon'
import styles from './TeamCard.module.scss'
import type { Team } from '../../entities/Team/model/team'

type TeamCardProps = {
  team: Team
}

export const TeamCard = ({ team }: TeamCardProps) => {
  const navigate = useNavigate()

  // Загружаем информацию о хакатоне, если есть hackathonId
  const { data: hackathon } = useQuery({
    queryKey: ['hackathon', team.hackathonId],
    queryFn: () => hackathonService.getById(team.hackathonId!),
    enabled: !!team.hackathonId,
  })

  const handleClick = () => {
    navigate(`/teams/${team.id}`)
  }

  const handleHackathonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (team.hackathonId) {
      navigate(`/hackatons/${team.hackathonId}`)
    }
  }

  // Объединяем капитана и участников для отображения
  const allMembers = [team.captain, ...team.participants]

  return (
    <article 
      className={styles.teamCard}
      onClick={handleClick}
    >
      <div className={styles.teamCard__header}>
        <h3 className={styles.teamCard__name}>{team.title}</h3>
        <span className={styles.teamCard__info}>
          {allMembers.length} участников
        </span>
      </div>

      {hackathon && (
        <div className={styles.teamCard__hackathon} onClick={handleHackathonClick}>
          <span className={styles.teamCard__hackathonLabel}>Хакатон:</span>
          <span className={styles.teamCard__hackathonName}>{hackathon.title}</span>
        </div>
      )}

      {team.description && (
        <p className={styles.teamCard__description}>
          {team.description.length > 100 
            ? `${team.description.substring(0, 100)}...` 
            : team.description}
        </p>
      )}

      {allMembers && allMembers.length > 0 && (
        <div className={styles.teamCard__members}>
          <div className={styles.teamCard__membersList}>
            {allMembers.slice(0, 4).map((member) => (
              <div key={member.id} className={styles.teamCard__member}>
                <img 
                  src={member.avatarUrl || 'https://via.placeholder.com/40'} 
                  alt={member.name}
                  className={styles.teamCard__memberAvatar}
                />
                <span className={styles.teamCard__memberName}>{member.name}</span>
              </div>
            ))}
            {allMembers.length > 4 && (
              <div className={styles.teamCard__moreMembers}>
                +{allMembers.length - 4}
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

