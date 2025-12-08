import { NavLink, useLocation } from "react-router-dom"
import { useEffect } from "react"
import styles from "./Sidebar.module.scss"
import "../../../app/mainStyles/main.scss"
import hackIcon from "../../../shared/assets/icons/sidebar/hackIcon.svg"
import participantIcon from "../../../shared/assets/icons/sidebar/participantIcon.svg"
import teamIcon from "../../../shared/assets/icons/sidebar/teamIcon.svg"

type SidebarProps = {
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const location = useLocation()

  // Закрываем меню при изменении маршрута на мобильных
  useEffect(() => {
    if (window.innerWidth <= 767 && onClose && isOpen) {
      onClose()
    }
  }, [location.pathname])

  // Отладка для проверки состояния
  useEffect(() => {
    if (window.innerWidth <= 767) {
      console.log('Sidebar isOpen:', isOpen, 'window width:', window.innerWidth)
      const sidebarElement = document.querySelector(`.${styles.sidebar}`)
      if (sidebarElement) {
        console.log('Sidebar element classes:', sidebarElement.className)
        console.log('Sidebar computed transform:', window.getComputedStyle(sidebarElement).transform)
      }
    }
  }, [isOpen, styles.sidebar])

  return (
    <>
      <aside 
        className={`${styles.sidebar} ${isOpen ? styles.mobileOpen : ''}`}
      >
        <nav className={styles.sidebar__nav}>
          <ul className={styles.sidebar__list}>
            <li>
              <NavLink 
                to="/hackatons"
                className={() => {
                  const isHackatonsPage = location.pathname === '/' || location.pathname === '/hackatons';
                  return isHackatonsPage
                    ? `${styles.sidebar__link} ${styles.sidebar__link_active}`
                    : styles.sidebar__link
                }}
                onClick={() => {
                  if (window.innerWidth <= 767 && onClose) {
                    onClose()
                  }
                }}
              >
                <div className={styles.sidebar__link__wrapper}>
                  <img className={styles.sidebar__link_img} src={hackIcon} alt="Хакатоны" />
                  <p>Хакатоны</p>
                </div>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/participants"
                className={({ isActive }) => 
                  isActive 
                    ? `${styles.sidebar__link} ${styles.sidebar__link_active}` 
                    : styles.sidebar__link
                }
                onClick={() => {
                  if (window.innerWidth <= 767 && onClose) {
                    onClose()
                  }
                }}
              >
                <div className={styles.sidebar__link__wrapper}>
                  <img className={styles.sidebar__link_img} src={participantIcon} alt="Участники" />
                  <p>Участники</p>
                </div>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/teams"
                className={({ isActive }) => 
                  isActive 
                    ? `${styles.sidebar__link} ${styles.sidebar__link_active}` 
                    : styles.sidebar__link
                }
                onClick={() => {
                  if (window.innerWidth <= 767 && onClose) {
                    onClose()
                  }
                }}
              >
                <div className={styles.sidebar__link__wrapper}>
                  <img className={styles.sidebar__link_img} src={teamIcon} alt="Команды" />
                  <p>Команды</p>
                </div>
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      
      {/* Overlay для мобильных */}
      {isOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={onClose}
        />
      )}
    </>
  )
}