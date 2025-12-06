import { ProfileEditForm } from '../../features/ProfileEdit/ProfileEditForm'
import styles from './Profile.module.scss'

export const Profile = () => {
  return (
    <div className={styles.profile}>
      <h2 className={styles.profile__title}>Редактирование профиля</h2>
      <ProfileEditForm />
    </div>
  )
}
