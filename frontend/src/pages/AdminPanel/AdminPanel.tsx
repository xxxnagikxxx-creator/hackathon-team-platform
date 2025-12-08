import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateHackathon, EditHackathon } from '../../features/HackathonManagement'
import { AdminLoginForm } from '../../features/AdminAuth'
import { useAdmin } from '../../app/providers/AdminProvider'
import { hackathonService } from '../../entities/Hackathon'
import type { Hackathon } from '../../entities/Hackathon'
import { exportTeamsToCSV, downloadCSV } from '../../shared/utils/csvExport'
import styles from './AdminPanel.module.scss'

export const AdminPanel = () => {
  const { isAuthenticated, isLoading, logout, checkAuth } = useAdmin()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingHackathon, setEditingHackathon] = useState<Hackathon | null>(null)
  const [exportingHackathonId, setExportingHackathonId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: hackathons, isLoading: isLoadingHackathons } = useQuery({
    queryKey: ['hackathons'],
    queryFn: () => hackathonService.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => hackathonService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hackathons'] })
    },
  })

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Ошибка при выходе:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот хакатон?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Ошибка при удалении:', error)
        alert('Ошибка при удалении хакатона')
      }
    }
  }

  const handleEdit = (hackathon: Hackathon) => {
    setEditingHackathon(hackathon)
    setShowCreateForm(false)
  }

  const handleCreateSuccess = () => {
    setShowCreateForm(false)
    queryClient.invalidateQueries({ queryKey: ['hackathons'] })
  }

  const handleEditSuccess = () => {
    setEditingHackathon(null)
    queryClient.invalidateQueries({ queryKey: ['hackathons'] })
  }

  const handleCancel = () => {
    setShowCreateForm(false)
    setEditingHackathon(null)
  }

  const handleExportCSV = async (hackathon: Hackathon) => {
    setExportingHackathonId(hackathon.id)
    try {
      // Получаем статистику команд
      const teams = await hackathonService.getStatistics(hackathon.id)
      
      if (!teams || teams.length === 0) {
        alert('Нет команд для экспорта')
        return
      }
      
      // Преобразуем в CSV
      const csvContent = exportTeamsToCSV(teams, hackathon.title)
      
      // Формируем имя файла
      const filename = `${hackathon.title.replace(/[^a-zа-яё0-9]/gi, '_')}_команды_${new Date().toISOString().split('T')[0]}.csv`
      
      // Скачиваем файл
      downloadCSV(csvContent, filename)
    } catch (error) {
      console.error('Ошибка при экспорте CSV:', error)
      alert('Ошибка при экспорте данных. Попробуйте еще раз.')
    } finally {
      setExportingHackathonId(null)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.adminPanel}>
        <div className={styles.adminPanel__loading}>Загрузка...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.adminPanel}>
        <div className={styles.adminPanel__login}>
          <AdminLoginForm closeAuth={() => {
            // Пустая функция для соответствия интерфейсу
          }} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.adminPanel}>
      <div className={styles.adminPanel__content}>
        <div className={styles.adminPanel__header}>
          <h1 className={styles.adminPanel__title}>Панель администратора</h1>
          <button onClick={handleLogout} className={styles.adminPanel__logoutButton}>
            Выйти
          </button>
        </div>

        <div className={styles.adminPanel__actions}>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm)
              setEditingHackathon(null)
            }}
            className={styles.adminPanel__createButton}
          >
            {showCreateForm ? 'Отмена' : '+ Создать новый хакатон'}
          </button>
        </div>

        {showCreateForm && (
          <div className={styles.adminPanel__section}>
            <h2 className={styles.adminPanel__sectionTitle}>Создать новый хакатон</h2>
            <CreateHackathon
              onSuccess={handleCreateSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}

        {editingHackathon && (
          <div className={styles.adminPanel__section}>
            <h2 className={styles.adminPanel__sectionTitle}>Редактировать хакатон</h2>
            <EditHackathon
              hackathon={editingHackathon}
              onSuccess={handleEditSuccess}
              onCancel={handleCancel}
            />
          </div>
        )}

        <div className={styles.adminPanel__section}>
          <h2 className={styles.adminPanel__sectionTitle}>Управление хакатонами</h2>
          {isLoadingHackathons ? (
            <div className={styles.adminPanel__loading}>Загрузка хакатонов...</div>
          ) : hackathons && hackathons.length > 0 ? (
            <div className={styles.adminPanel__hackathonsList}>
              {hackathons.map((hackathon) => (
                <div key={hackathon.id} className={styles.adminPanel__hackathonItem}>
                  {hackathon.imageUrl && (
                    <img
                      src={hackathon.imageUrl}
                      alt={hackathon.title}
                      className={styles.adminPanel__hackathonImage}
                    />
                  )}
                  <div className={styles.adminPanel__hackathonInfo}>
                    <h3 className={styles.adminPanel__hackathonTitle}>{hackathon.title}</h3>
                    <p className={styles.adminPanel__hackathonDescription}>
                      {hackathon.description.length > 100
                        ? hackathon.description.substring(0, 100) + '...'
                        : hackathon.description}
                    </p>
                    <div className={styles.adminPanel__hackathonMeta}>
                      <span>
                        📅 {new Date(hackathon.startDate).toLocaleDateString()} -{' '}
                        {new Date(hackathon.endDate).toLocaleDateString()}
                      </span>
                      {hackathon.location && <span>📍 {hackathon.location}</span>}
                    </div>
                  </div>
                  <div className={styles.adminPanel__hackathonActions}>
                    <button
                      onClick={() => handleExportCSV(hackathon)}
                      className={styles.adminPanel__exportButton}
                      title="Экспортировать команды в CSV"
                      disabled={exportingHackathonId === hackathon.id || !!editingHackathon}
                    >
                      {exportingHackathonId === hackathon.id ? 'Экспорт...' : '📥 Экспорт CSV'}
                    </button>
                    <button
                      onClick={() => handleEdit(hackathon)}
                      className={styles.adminPanel__editButton}
                      disabled={!!editingHackathon}
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(hackathon.id)}
                      className={styles.adminPanel__deleteButton}
                      disabled={deleteMutation.isPending || !!editingHackathon}
                    >
                      {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.adminPanel__empty}>Хакатоны не найдены</div>
          )}
        </div>
      </div>
    </div>
  )
}
