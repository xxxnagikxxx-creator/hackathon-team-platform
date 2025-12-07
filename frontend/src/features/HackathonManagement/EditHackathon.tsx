import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hackathonService } from '../../entities/Hackathon'
import type { UpdateHackathonDto, Hackathon } from '../../entities/Hackathon'
import styles from './CreateHackathon.module.scss'

type EditHackathonProps = {
  hackathon: Hackathon
  onSuccess?: () => void
  onCancel?: () => void
}

export const EditHackathon = ({ hackathon, onSuccess, onCancel }: EditHackathonProps) => {
  const [formData, setFormData] = useState<UpdateHackathonDto>({
    title: hackathon.title,
    description: hackathon.description,
    imageUrl: hackathon.imageUrl,
    startDate: hackathon.startDate,
    endDate: hackathon.endDate,
    location: hackathon.location,
  })

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: UpdateHackathonDto) => hackathonService.update(hackathon.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
      onSuccess?.()
    },
  })

  useEffect(() => {
    // Обновляем форму при изменении хакатона
    // Преобразуем даты в формат для date input (YYYY-MM-DD)
    const formatDateForInput = (dateString: string) => {
      if (!dateString) return ''
      // Если дата в формате ISO с временем, обрезаем до даты
      if (dateString.includes('T')) {
        return dateString.split('T')[0]
      }
      // Если только дата, возвращаем как есть
      return dateString
    }
    
    setFormData({
      title: hackathon.title,
      description: hackathon.description,
      imageUrl: hackathon.imageUrl,
      startDate: formatDateForInput(hackathon.startDate),
      endDate: formatDateForInput(hackathon.endDate),
      location: hackathon.location,
      maxParticipants: hackathon.maxParticipants,
    })
  }, [hackathon])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  const handleChange = (field: keyof UpdateHackathonDto, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className={styles.createHackathon}>
      <h3 className={styles.createHackathon__title}>Редактировать хакатон</h3>
      <form onSubmit={handleSubmit} className={styles.createHackathon__form}>
        <div className={styles.createHackathon__field}>
          <label className={styles.createHackathon__label}>
            Название хакатона <span className={styles.createHackathon__required}>*</span>
          </label>
          <input
            type="text"
            value={formData.title || ''}
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
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            className={styles.createHackathon__textarea}
            placeholder="Опишите хакатон"
            rows={4}
            required
          />
        </div>

        <div className={styles.createHackathon__field}>
          <label className={styles.createHackathon__label}>
            Изображение <span className={styles.createHackathon__required}>*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (event) => {
                  const base64String = event.target?.result as string
                  handleChange('imageUrl', base64String)
                }
                reader.readAsDataURL(file)
              }
            }}
            className={styles.createHackathon__input}
          />
          {formData.imageUrl && (
            <img 
              src={formData.imageUrl} 
              alt="Preview" 
              style={{ 
                maxWidth: '200px', 
                maxHeight: '200px', 
                marginTop: '10px',
                borderRadius: '8px'
              }} 
            />
          )}
        </div>

        <div className={styles.createHackathon__row}>
          <div className={styles.createHackathon__field}>
            <label className={styles.createHackathon__label}>
              Дата начала <span className={styles.createHackathon__required}>*</span>
            </label>
            <input
              type="date"
              value={formData.startDate || ''}
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
              type="date"
              value={formData.endDate || ''}
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

        <div className={styles.createHackathon__actions}>
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`${styles.createHackathon__button} ${styles.createHackathon__button_primary}`}
          >
            {mutation.isPending ? (
              <>
                <span className={styles.createHackathon__spinner}></span>
                Сохранение...
              </>
            ) : (
              'Сохранить изменения'
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
            Ошибка при сохранении изменений. Попробуйте еще раз.
          </div>
        )}

        {mutation.isSuccess && (
          <div className={styles.createHackathon__success}>
            Изменения успешно сохранены!
          </div>
        )}
      </form>
    </div>
  )
}
