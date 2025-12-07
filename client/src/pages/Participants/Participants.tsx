import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { participantService } from '../../entities/Participant'
import { ParticipantCard } from '../../widgets/ParticipantCard'
import { teamService } from '../../entities/Team'
import { useUser } from '../../app/providers/UserProvider'
import styles from './Participants.module.scss'
import { useState, useMemo } from 'react'

export const Participants = () => {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const { user } = useUser()
  const queryClient = useQueryClient()

  const { data: participants, isLoading } = useQuery({
    queryKey: ['participants'],
    queryFn: () => participantService.getAll(),
  })

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getAll(),
    enabled: !!user,
  })

  const inviteMutation = useMutation({
    mutationFn: ({ teamId, participantId }: { teamId: number; participantId: number }) =>
      teamService.inviteMember({ teamId, participantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      alert('Приглашение отправлено!')
    },
    onError: (error) => {
      console.error('Ошибка отправки приглашения:', error)
      alert('Не удалось отправить приглашение')
    },
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

  const handleInvite = (participantId: number) => {
    if (!selectedTeamId) {
      alert('Сначала выберите команду')
      return
    }
    inviteMutation.mutate({ teamId: selectedTeamId, participantId })
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
      
      {user && teams && teams.length > 0 && (
        <div className={styles.participants__teamSelect}>
          <label>Выберите команду для приглашения:</label>
          <select 
            value={selectedTeamId || ''} 
            onChange={(e) => setSelectedTeamId(Number(e.target.value) || null)}
          >
            <option value="">Не выбрана</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
      )}

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
                  tgTag={participant.tgTag}
                  showActions={!!user}
                  onInvite={participant.id ? () => handleInvite(participant.id) : undefined}
                  onRespond={() => {
                    alert('Отклик отправлен!')
                  }}
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
