import styles from './Header.module.scss'
import bellIcon from '../../../shared/assets/icons/header/bellIcon.svg'
import personIcon from '../../../shared/assets/icons/header/personIcon.svg'
import { NavLink } from 'react-router-dom'
import { MainButton } from '../../../shared/ui/MainButton/MainButton'
import logo from '../../../shared/assets/logo.svg'
import { AuthBlock } from '../../AuthBlock'
import { useState } from 'react'
import { useUser } from '../../../app/providers/UserProvider'
import { useAdmin } from '../../../app/providers/AdminProvider'

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, user, telegramId, logout } = useUser()
  const { isAuthenticated: isAdminAuthenticated } = useAdmin()

  function openAuth() {
    setIsOpen(true)
  }

  function closeAuth() {
    setIsOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/'
    } catch (error) {
      console.error('Ошибка при выходе:', error)
    }
  }

  return (
    <>
      <header className={styles.header__wrapper}>
        <NavLink to="/">
          <img src={logo} alt="Fullstack Fusion" className={styles.header__logo} />
        </NavLink>

        <div className={styles.header__icons}>
          {isAuthenticated && (
            <>
              <NavLink to="/notifications" className={styles.header__iconLink}>
                <img src={bellIcon} alt="Уведомления" className={styles.header__notifications} />
              </NavLink>

              <NavLink 
                to={telegramId ? `/participants/${telegramId}` : "/profile"} 
                className={styles.header__iconLink}
              >
                <img
                  src={user?.avatarUrl || user?.avatarSrc || personIcon}
                  alt="Профиль"
                  className={styles.header__profile}
                />
              </NavLink>

              <button 
                onClick={handleLogout}
                className={styles.header__logoutButton}
                title="Выйти"
              >
                Выйти
              </button>
            </>
          )}

          {!isAuthenticated && (
            <>
            <MainButton onClick={openAuth} className={styles.header__loginButton}>
              Войти
            </MainButton>
              <NavLink to="/hackatons/admin">
                <button className={styles.header__adminButton} title="Вход для администратора">
                  Админ
                </button>
              </NavLink>
            </>
          )}
        </div>
      </header>

      {isOpen && <AuthBlock closeAuth={closeAuth} />}
    </>
  )
}