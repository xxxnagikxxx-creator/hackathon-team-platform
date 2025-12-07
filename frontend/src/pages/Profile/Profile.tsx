import { ProfileEditForm } from '../../features/ProfileEdit/ProfileEditForm'
import { useUser } from '../../app/providers/UserProvider'
import { useNavigate } from 'react-router-dom'
import styles from './Profile.module.scss'

export const Profile = () => {
  const { logout } = useUser()
  const navigate = useNavigate()

  const handleLogout = async () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
      try {
        await logout()
        navigate('/')
      } catch (error) {
        console.error('Ошибка при выходе:', error)
        alert('Ошибка при выходе из системы')
      }
    }
  }

  return (
    <div className={styles.profile}>
      <div className={styles.profile__header}>
      <h2 className={styles.profile__title}>Редактирование профиля</h2>
        <button 
          onClick={handleLogout}
          className={styles.profile__logoutButton}
        >
          Выйти
        </button>
      </div>
      <ProfileEditForm />
    </div>
  )
}
