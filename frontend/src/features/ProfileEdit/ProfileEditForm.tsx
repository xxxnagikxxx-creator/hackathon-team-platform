import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { participantService } from '../../entities/Participant'
import type { UpdateParticipantDto } from '../../entities/Participant'
import { useUser } from '../../app/providers/UserProvider'
import styles from './ProfileEditForm.module.scss'

const POPULAR_SKILLS = [
  'Python',
  'JavaScript',
  'TypeScript',
  'React',
  'Vue',
  'Angular',
  'Node.js',
  'FastAPI',
  'Django',
  'Flask',
  'Express',
  'Next.js',
  'Git',
  'Docker',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'SQLAlchemy',
  'Pydantic',
  'SCSS',
  'CSS',
  'HTML',
  'Axios',
  'Redux',
  'GraphQL',
  'REST API',
  'GO',
  'Java',
  'C++',
  'C#',
  'PHP',
  'Ruby',
  'Rust',
  'Kotlin',
  'Swift',
  // ML / Data Science
  'TensorFlow',
  'PyTorch',
  'Scikit-learn',
  'Pandas',
  'NumPy',
  'Keras',
  'OpenCV',
  'Jupyter',
  'MLflow',
  'XGBoost',
  'LightGBM',
  'Hugging Face',
  'NLP',
  'Computer Vision',
  // Продакт-менеджмент
  'Product Management',
  'Agile',
  'Scrum',
  'Jira',
  'Confluence',
  'Miro',
  'Notion',
  'A/B Testing',
  'Analytics',
  'User Research',
  'Roadmapping',
  // Дизайн
  'Figma',
  'Adobe XD',
  'Sketch',
  'Adobe Photoshop',
  'Adobe Illustrator',
  'InVision',
  'Prototyping',
  'UI Design',
  'UX Design',
  'Design Systems',
  'Wireframing',
  'User Testing',
  // Cloud & DevOps
  'AWS',
  'Azure',
  'Kubernetes',
  'GCP',
]

const ROLE_OPTIONS = [
  'Фронтенд разработчик',
  'Бэкенд разработчик',
  'Fullstack разработчик',
  'DevOps инженер',
  'Мобильный разработчик',
  'Data Scientist',
  'ML инженер',
  'QA инженер',
  'UI/UX дизайнер',
  'Product Manager',
  'Другое',
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
  const { telegramId, isAuthenticated } = useUser()

  const { data: participant, isLoading } = useQuery({
    queryKey: ['participant', participantId || telegramId || 'current'],
    queryFn: () => {
      if (participantId) {
        return participantService.getById(participantId)
      }
      if (telegramId) {
        return participantService.getCurrent(telegramId)
      }
      throw new Error('telegramId is required to load current user')
    },
    enabled: !!(participantId || telegramId),
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
    mutationFn: (data: UpdateParticipantDto) => {
      if (participantId) {
        return participantService.update(participantId, data)
      }
      if (telegramId) {
        return participantService.updateCurrent(telegramId, data)
      }
      throw new Error('telegramId is required to update current user')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participant'] })
      onSuccess?.()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('ProfileEditForm: Отправка данных', formData)
    mutation.mutate({
      ...formData,
      updatedAt: new Date().toISOString(),
    }, {
      onSuccess: (data) => {
        console.log('ProfileEditForm: Данные успешно сохранены', data)
      },
      onError: (error) => {
        console.error('ProfileEditForm: Ошибка при сохранении', error)
      }
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
          <select
            value={formData.role || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
            className={styles.profileEdit__select}
            required
          >
            <option value="">-- Выберите роль --</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
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

        {isAuthenticated && (
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
        )}
        
        {!isAuthenticated && (
          <div className={styles.profileEdit__notAuthenticated}>
            <p>Для сохранения изменений необходимо войти в систему</p>
          </div>
        )}

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
