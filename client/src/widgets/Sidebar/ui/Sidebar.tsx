import { NavLink, useLocation } from "react-router-dom"
import styles from "./Sidebar.module.scss"
import "../../../app/mainStyles/main.scss"
import hackIcon from "../../../shared/assets/icons/sidebar/hackIcon.svg"
import participantIcon from "../../../shared/assets/icons/sidebar/participantIcon.svg"
import teamIcon from "../../../shared/assets/icons/sidebar/teamIcon.svg"

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
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
            >
              <div className={styles.sidebar__link__wrapper}>
                <img className={styles.sidebar__link_img} src={hackIcon} />
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
            >
              <div className={styles.sidebar__link__wrapper}>
                <img className={styles.sidebar__link_img} src={participantIcon} />
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
            >
              <div className={styles.sidebar__link__wrapper}>
                <img className={styles.sidebar__link_img} src={teamIcon} />
                <p>Команды</p>
              </div>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  )
}


// className={() => {
//                 const isHackatonsPage = location.pathname === '/' || location.pathname === '/hackatons'
//                 return isHackatonsPage
//                   ? `${styles.sidebar__link} ${styles.sidebar__link_active}` 
//                   : styles.sidebar__link
//               }}