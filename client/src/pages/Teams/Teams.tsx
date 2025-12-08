import { useQuery } from '@tanstack/react-query'
import { teamService } from '../../entities/Team'
import { TeamCard } from '../../widgets/TeamCard'
import styles from './Teams.module.scss'

export const Teams = () => {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getAll(),
  })

  if (isLoading) {
    return (
      <div className={styles.teams__loading}>
        <div className={styles.teams__spinner}></div>
        <p>Загрузка команд...</p>
      </div>
    )
  }

  return (
    <div className={styles.teams}>
      <h2 className={styles.teams__title}>Команды</h2>
      
      {teams && teams.length > 0 ? (
        <div className={styles.teams__section}>
          <div className={styles.teams__list}>
            {teams.map((team, index) => (
              <div
                key={team.id}
                className={styles.teams__cardWrapper}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TeamCard team={team} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.teams__empty}>
          <p>Команды не найдены</p>
        </div>
      )}
    </div>
  )
}
