import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonService } from '../../entities/Hackathon'
import type { CreateHackathonDto } from '../../entities/Hackathon'
import styles from './CreateHackathon.module.scss'

type CreateHackathonProps = {
  onSuccess?: () => void
  onCancel?: () => void
}

export const CreateHackathon = ({ onSuccess, onCancel }: CreateHackathonProps) => {
  const [formData, setFormData] = useState<CreateHackathonDto>({
    title: '',
    description: '',
    imageUrl: '',
    startDate: '',
    endDate: '',
    location: '',
    maxParticipants: undefined,
  })

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: CreateHackathonDto) => hackathonService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      onSuccess?.()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleChange = (field: keyof CreateHackathonDto, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className={styles.createHackathon}>
      <h3 className={styles.createHackathon__title}>Создать новый хакатон</h3>
      <form onSubmit={handleSubmit} className={styles.createHackathon__form}>
        <div className={styles.createHackathon__field}>
          <label className={styles.createHackathon__label}>
            Название хакатона <span className={styles.createHackathon__required}>*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={styles.createHackathon__input}
            placeholder="Введите название"
            required
          />
        </div>

        <div className={styles.createHackathon__field}>
          <label className={styles.createHackathon__label}>
            Описание <span className={styles.createHackathon__required}>*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className={styles.createHackathon__textarea}
            placeholder="Опишите хакатон"
            rows={4}
            required
          />
        </div>

        <div className={styles.createHackathon__field}>
          <label className={styles.createHackathon__label}>
            URL изображения <span className={styles.createHackathon__required}>*</span>
          </label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => handleChange('imageUrl', e.target.value)}
            className={styles.createHackathon__input}
            placeholder="https://example.com/image.jpg"
            required
          />
        </div>

        <div className={styles.createHackathon__row}>
          <div className={styles.createHackathon__field}>
            <label className={styles.createHackathon__label}>
              Дата начала <span className={styles.createHackathon__required}>*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className={styles.createHackathon__input}
              required
            />
          </div>

          <div className={styles.createHackathon__field}>
            <label className={styles.createHackathon__label}>
              Дата окончания <span className={styles.createHackathon__required}>*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className={styles.createHackathon__input}
              required
            />
          </div>
        </div>

        <div className={styles.createHackathon__row}>
          <div className={styles.createHackathon__field}>
            <label className={styles.createHackathon__label}>Место проведения</label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              className={styles.createHackathon__input}
              placeholder="Город или онлайн"
            />
          </div>

          <div className={styles.createHackathon__field}>
            <label className={styles.createHackathon__label}>Максимум участников</label>
            <input
              type="number"
              value={formData.maxParticipants || ''}
              onChange={(e) => handleChange('maxParticipants', e.target.value ? Number(e.target.value) : undefined)}
              className={styles.createHackathon__input}
              placeholder="Не ограничено"
              min="1"
            />
          </div>
        </div>

        <div className={styles.createHackathon__actions}>
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`${styles.createHackathon__button} ${styles.createHackathon__button_primary}`}
          >
            {mutation.isPending ? (
              <>
                <span className={styles.createHackathon__spinner}></span>
                Создание...
              </>
            ) : (
              'Создать хакатон'
            )}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className={`${styles.createHackathon__button} ${styles.createHackathon__button_secondary}`}
            >
              Отмена
            </button>
          )}
        </div>

        {mutation.isError && (
          <div className={styles.createHackathon__error}>
            Ошибка при создании хакатона. Попробуйте еще раз.
          </div>
        )}

        {mutation.isSuccess && (
          <div className={styles.createHackathon__success}>
            Хакатон успешно создан!
          </div>
        )}
      </form>
    </div>
  )
}
