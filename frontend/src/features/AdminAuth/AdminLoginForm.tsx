import { useState } from 'react'
import styles from './AdminLoginForm.module.scss'
import closeIcon from '../../shared/assets/icons/closeicon.png'
import { adminAuthService } from './adminAuthService'
import { useAdmin } from '../../app/providers/AdminProvider'

type Props = {
  closeAuth: () => void
}

export const AdminLoginForm = ({ closeAuth }: Props) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAdmin()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!email.trim()) {
      setError('Введите email')
      return
    }

    if (!password.trim()) {
      setError('Введите пароль')
      return
    }

    setIsLoading(true)

    try {
      // Выполняем логин на бэкенде
      await adminAuthService.login(email, password)
      
      // Устанавливаем статус авторизации
      await login()
      
      setIsLoading(false)
      // Закрываем модальное окно после успешного входа
      closeAuth()
    } catch (err: any) {
      console.error('Admin login error:', err)
      setIsLoading(false)
      const errorMessage = err?.response?.data?.detail || err?.message || 'Ошибка при входе. Проверьте email и пароль.'
      setError(errorMessage)
    }
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
          <h3 className={styles.auth__title}>Вход для администратора</h3>
          <form onSubmit={handleSubmit}>
            <p className={styles.auth__input_text}>Email</p>
            <input
              className={styles.auth__input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите email"
              autoFocus
              required
            />
            <p className={styles.auth__input_text}>Пароль</p>
            <input
              className={styles.auth__input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
            />
            {error && (
              <div className={styles.auth__error}>
                {error}
              </div>
            )}
            <button
              type="submit"
              className={styles.auth__button}
              disabled={isLoading || !email.trim() || !password.trim()}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
