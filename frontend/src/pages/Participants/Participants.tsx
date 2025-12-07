import { useQuery } from '@tanstack/react-query'
import { participantService } from '../../entities/Participant'
import { ParticipantCard } from '../../widgets/ParticipantCard'
import styles from './Participants.module.scss'
import { useState, useMemo } from 'react'

export const Participants = () => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  const { data: participants, isLoading } = useQuery({
    queryKey: ['participants'],
    queryFn: () => participantService.getAll(),
  })


  // Получаем все уникальные навыки
  const allSkills = useMemo(() => {
    if (!participants) return []
    const skillsSet = new Set<string>()
    participants.forEach(p => {
      p.skills?.forEach(skill => skillsSet.add(skill))
    })
    return Array.from(skillsSet).sort()
  }, [participants])

  // Фильтруем участников по навыкам
  const filteredParticipants = useMemo(() => {
    if (!participants) return []
    if (selectedSkills.length === 0) return participants
    return participants.filter(p => 
      p.skills?.some(skill => selectedSkills.includes(skill))
    )
  }, [participants, selectedSkills])

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }


  if (isLoading) {
    return (
      <div className={styles.participants__loading}>
        <div className={styles.participants__spinner}></div>
        <p>Загрузка участников...</p>
      </div>
    )
  }

  return (
    <div className={styles.participants__wrapper}>
      <h2 className={styles.participants__title}>Участники</h2>
      

      <div className={styles.participants__filters}>
        <h3 className={styles.participants__filtersTitle}>Фильтр по навыкам:</h3>
        <div className={styles.participants__skillsFilter}>
          {allSkills.map(skill => (
            <button
              key={skill}
              className={`${styles.participants__skillTag} ${
                selectedSkills.includes(skill) ? styles.participants__skillTag_active : ''
              }`}
              onClick={() => toggleSkill(skill)}
            >
              {skill}
            </button>
          ))}
        </div>
        {selectedSkills.length > 0 && (
          <button
            className={styles.participants__clearFilters}
            onClick={() => setSelectedSkills([])}
          >
            Очистить фильтры
          </button>
        )}
      </div>

      <div className={styles.participants__section}>
        <section className={styles.participants__list}>
          {filteredParticipants && filteredParticipants.length > 0 ? (
            filteredParticipants.map((participant, index) => (
              <div
                key={participant.id}
                className={styles.participants__item}
                style={{ animationDelay: `${index * 0.05}s` }}
              > 
                <ParticipantCard
                  id={participant.id}
                  name={participant.name}
                  src={participant.avatarUrl || ''}
                  role={participant.role}
                  skills={participant.skills}
                  bio={participant.bio}
                  tgTag={participant.tgTag}
                />
              </div>
            ))
          ) : (
            <div className={styles.participants__empty}>
              <p>
                {selectedSkills.length > 0 
                  ? 'Участники с выбранными навыками не найдены' 
                  : 'Участники не найдены'}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
