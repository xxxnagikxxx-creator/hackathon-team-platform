import { useState } from 'react'
import styles from './AuthBlock.module.scss'
import closeIcon from '../../../shared/assets/icons/closeicon.png'
import { useUser } from '../../../app/providers/UserProvider'
import type { User } from '../../../entities/User'

type Props = {
  closeAuth: () => void
}

export const AuthBlock = ({ closeAuth }: Props) => {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Здесь реальная логика авторизации через API
    // Пока делаем мок-авторизацию
    setTimeout(() => {
      const mockUser: User = {
        id: 1,
        email: 'user@example.com',
        name: 'Пользователь',
        createdAt: new Date().toISOString(),
      }
      login(mockUser)
      setIsLoading(false)
      closeAuth()
    }, 1000)
  }

  return (
    <div className={styles.auth} onClick={closeAuth}>
      <div className={styles.auth__wrapper} onClick={(e) => e.stopPropagation()}>
        <img
          src={closeIcon}
          alt="закрыть"
          className={styles.auth__close_btn}
          onClick={closeAuth}
        />
        <div>
          <h3 className={styles.auth__title}>Вход</h3>
          <form onSubmit={handleSubmit}>
            <p className={styles.auth__input_text}>Код от телеграм-бота</p>
            <input
              className={styles.auth__input}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Введите код"
              autoFocus
              required
            />
            <button
              type="submit"
              className={styles.auth__button}
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          <p className={styles.auth__desc_bot}>
            Напишите <a href="#">бот</a>, чтобы получить код
          </p>
        </div>
      </div>
    </div>
  )
}
