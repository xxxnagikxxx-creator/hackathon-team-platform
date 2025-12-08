import styles from './Header.module.scss'
import bellIcon from '../../../shared/assets/icons/header/bellIcon.svg'
import personIcon from '../../../shared/assets/icons/header/personIcon.svg'
import { NavLink } from 'react-router-dom'
import { MainButton } from '../../../shared/ui/MainButton/MainButton'
import logo from '../../../shared/assets/logo.svg'
import { AuthBlock } from '../../AuthBlock'
import { useState } from 'react'
import { useUser } from '../../../app/providers/UserProvider'

type HeaderProps = {
  onMenuToggle?: () => void
  isMenuOpen?: boolean
}

export const Header = ({ onMenuToggle, isMenuOpen }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, user, telegramId, logout } = useUser()

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
        {/* Бургер-меню только для авторизованных на мобильных */}
        {isAuthenticated && (
          <button
            className={styles.header__burger}
            onClick={onMenuToggle}
            aria-label="Меню"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMenuOpen ? (
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              ) : (
                <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              )}
            </svg>
          </button>
        )}

        <NavLink to="/" className={styles.header__logoLink}>
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
                <span className={styles.header__logoutText}>Выйти</span>
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