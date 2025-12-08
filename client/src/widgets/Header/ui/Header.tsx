import styles from './Header.module.scss'
import bellIcon from '../../../shared/assets/icons/header/bellIcon.svg'
import personIcon from '../../../shared/assets/icons/header/personIcon.svg'
import { NavLink } from 'react-router-dom'
import { MainButton } from '../../../shared/ui/MainButton/MainButton'
import logo from '../../../shared/assets/logo.svg'
import { AuthBlock } from '../../AuthBlock'
import { useState } from 'react'
import { useUser } from '../../../app/providers/UserProvider'

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, user } = useUser()

  function openAuth() {
    setIsOpen(true)
  }

  function closeAuth() {
    setIsOpen(false)
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

              <NavLink to="/profile" className={styles.header__iconLink}>
                <img
                  src={user?.avatarUrl || user?.avatarSrc || personIcon}
                  alt="Профиль"
                  className={styles.header__profile}
                />
              </NavLink>
            </>
          )}

          {!isAuthenticated && (
            <MainButton onClick={openAuth} className={styles.header__loginButton}>
              Войти
            </MainButton>
          )}
        </div>
      </header>

      {isOpen && <AuthBlock closeAuth={closeAuth} />}
    </>
  )
}