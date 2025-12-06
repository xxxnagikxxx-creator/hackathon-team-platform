import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { participantService } from '../../entities/Participant'
import type { UpdateParticipantDto } from '../../entities/Participant'
import styles from './ProfileEditForm.module.scss'

const POPULAR_SKILLS = [
  'React',
  'GO',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Python',
  'Java',
  'Vue',
  'Angular',
  'Next.js',
  'Express',
  'PostgreSQL',
  'MongoDB',
  'Docker',
  'Git',
  'SCSS',
  'Axios',
  'Redux',
  'GraphQL',
]

type ProfileEditFormProps = {
  participantId?: number
  onSuccess?: () => void
}

export const ProfileEditForm = ({ participantId, onSuccess }: ProfileEditFormProps) => {
  const [formData, setFormData] = useState<UpdateParticipantDto>({
    name: '',
    role: '',
    skills: [],
    bio: '',
  })

  const [customSkill, setCustomSkill] = useState('')

  const queryClient = useQueryClient()

  const { data: participant, isLoading } = useQuery({
    queryKey: ['participant', participantId || 'current'],
    queryFn: () => (participantId ? participantService.getById(participantId) : participantService.getCurrent()),
    enabled: true,
  })

  useEffect(() => {
    if (participant) {
      setFormData({
        name: participant.name,
        role: participant.role,
        skills: participant.skills,
        bio: participant.bio || '',
      })
    }
  }, [participant])

  const mutation = useMutation({
    mutationFn: (data: UpdateParticipantDto) =>
      participantId ? participantService.update(participantId, data) : participantService.updateCurrent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant'] })
      onSuccess?.()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      ...formData,
      updatedAt: new Date().toISOString(),
    })
  }

  const toggleSkill = (skill: string) => {
    setFormData((prev) => {
      const currentSkills = prev.skills || []
      const newSkills = currentSkills.includes(skill)
        ? currentSkills.filter((s) => s !== skill)
        : [...currentSkills, skill]
      return { ...prev, skills: newSkills }
    })
  }

  const addCustomSkill = () => {
    if (customSkill.trim() && !formData.skills?.includes(customSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), customSkill.trim()],
      }))
      setCustomSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((s) => s !== skill) || [],
    }))
  }

  if (isLoading) {
    return (
      <div className={styles.profileEdit__loading}>
        <div className={styles.profileEdit__spinner}></div>
        <p>Загрузка профиля...</p>
      </div>
    )
  }

  return (
    <div className={styles.profileEdit}>
      <form onSubmit={handleSubmit} className={styles.profileEdit__form}>
        <div className={styles.profileEdit__field}>
          <label className={styles.profileEdit__label}>
            Имя <span className={styles.profileEdit__required}>*</span>
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className={styles.profileEdit__input}
            placeholder="Введите ваше имя"
            required
          />
        </div>

        <div className={styles.profileEdit__field}>
          <label className={styles.profileEdit__label}>
            Роль в команде <span className={styles.profileEdit__required}>*</span>
          </label>
          <input
            type="text"
            value={formData.role || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
            className={styles.profileEdit__input}
            placeholder="Например: Фронтенд разработчик"
            required
          />
        </div>

        <div className={styles.profileEdit__field}>
          <label className={styles.profileEdit__label}>Стек технологий</label>
          
          <div className={styles.profileEdit__skillsSection}>
            <p className={styles.profileEdit__skillsTitle}>Популярные технологии (нажмите для добавления):</p>
            <div className={styles.profileEdit__skillsGrid}>
              {POPULAR_SKILLS.map((skill) => {
                const isSelected = formData.skills?.includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`${styles.profileEdit__skillButton} ${
                      isSelected ? styles.profileEdit__skillButton_active : ''
                    }`}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={styles.profileEdit__customSkill}>
            <p className={styles.profileEdit__skillsTitle}>Добавить свою технологию:</p>
            <div className={styles.profileEdit__customSkillInput}>
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                className={styles.profileEdit__input}
                placeholder="Введите название технологии"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomSkill()
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className={styles.profileEdit__addButton}
                disabled={!customSkill.trim()}
              >
                Добавить
              </button>
            </div>
          </div>

          {formData.skills && formData.skills.length > 0 && (
            <div className={styles.profileEdit__selectedSkills}>
              <p className={styles.profileEdit__skillsTitle}>Выбранные технологии:</p>
              <div className={styles.profileEdit__selectedSkillsList}>
                {formData.skills.map((skill) => (
                  <span key={skill} className={styles.profileEdit__selectedSkill}>
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className={styles.profileEdit__removeSkill}
                      aria-label="Удалить"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.profileEdit__field}>
          <label className={styles.profileEdit__label}>О себе</label>
          <textarea
            value={formData.bio || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
            className={styles.profileEdit__textarea}
            placeholder="Расскажите о себе, своих интересах и опыте"
            rows={5}
          />
        </div>

        <div className={styles.profileEdit__actions}>
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`${styles.profileEdit__button} ${styles.profileEdit__button_primary}`}
          >
            {mutation.isPending ? (
              <>
                <span className={styles.profileEdit__spinner}></span>
                Сохранение...
              </>
            ) : (
              'Сохранить изменения'
            )}
          </button>
        </div>

        {mutation.isError && (
          <div className={styles.profileEdit__error}>
            Ошибка при сохранении профиля. Попробуйте еще раз.
          </div>
        )}

        {mutation.isSuccess && (
          <div className={styles.profileEdit__success}>
            Профиль успешно обновлен!
          </div>
        )}
      </form>
    </div>
  )
}
