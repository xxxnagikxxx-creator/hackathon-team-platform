import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../../app/providers/UserProvider'
import { AuthBlock } from '../../widgets/AuthBlock'
import { MainButton } from '../../shared/ui/MainButton/MainButton'
import styles from './Home.module.scss'

export const Home = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const { isAuthenticated } = useUser()
  const navigate = useNavigate()

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/hackatons')
    } else {
      setIsAuthOpen(true)
    }
  }

  return (
    <>
      <div className={styles.home}>
        <div className={styles.home__hero}>
          <h1 className={styles.home__title}>
            Платформа для поиска и формирования команд для хакатонов
          </h1>
          <p className={styles.home__subtitle}>
            Найди сокомандников, создай команду и участвуй в хакатонах ITAM сообщества
          </p>
          <MainButton onClick={handleGetStarted} className={styles.home__ctaButton}>
            {isAuthenticated ? 'Перейти к хакатонам' : 'Войти через Telegram'}
          </MainButton>
        </div>

        <div className={styles.home__features}>
          <div className={styles.home__feature}>
            <div className={styles.home__featureIcon}>🔍</div>
            <h3 className={styles.home__featureTitle}>Быстрый поиск</h3>
            <p className={styles.home__featureText}>
              Найди сокомандников с фильтрами по технологиям и навыкам
            </p>
          </div>

          <div className={styles.home__feature}>
            <div className={styles.home__featureIcon}>👥</div>
            <h3 className={styles.home__featureTitle}>Удобный профиль</h3>
            <p className={styles.home__featureText}>
              Создай анкету с навыками и опытом, чтобы команды могли тебя найти
            </p>
          </div>

          <div className={styles.home__feature}>
            <div className={styles.home__featureIcon}>🔔</div>
            <h3 className={styles.home__featureTitle}>Прозрачные приглашения</h3>
            <p className={styles.home__featureText}>
              Система уведомлений о приглашениях, вакансиях и откликах
            </p>
          </div>

          <div className={styles.home__feature}>
            <div className={styles.home__featureIcon}>⚡</div>
            <h3 className={styles.home__featureTitle}>Управление командой</h3>
            <p className={styles.home__featureText}>
              Присоединяйся к командам, управляй ролями и отслеживай статус
            </p>
          </div>
        </div>

        <div className={styles.home__cta}>
          <h2 className={styles.home__ctaTitle}>Готов начать?</h2>
          <p className={styles.home__ctaText}>
            Присоединяйся к платформе и найди свою команду для следующего хакатона
          </p>
          <MainButton onClick={handleGetStarted} className={styles.home__ctaButtonSecondary}>
            {isAuthenticated ? 'Перейти к хакатонам' : 'Войти через Telegram'}
          </MainButton>
        </div>
      </div>

      {isAuthOpen && <AuthBlock closeAuth={() => setIsAuthOpen(false)} />}
    </>
  )
}

