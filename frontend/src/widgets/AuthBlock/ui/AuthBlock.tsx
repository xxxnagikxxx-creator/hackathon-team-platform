import { useState } from 'react'
import styles from './AuthBlock.module.scss'
import closeIcon from '../../../shared/assets/icons/closeicon.png'
import { useUser } from '../../../app/providers/UserProvider'
import { authService } from '../../../features/Auth/authService'

type Props = {
  closeAuth: () => void
}

export const AuthBlock = ({ closeAuth }: Props) => {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!code.trim()) {
      setError('Введите код')
      return
    }

    setIsLoading(true)

    try {
      // Отправляем код на бэкенд
      const response = await authService.loginByCode(code)
      console.log('Login by code successful, telegram_id:', response.telegram_id)
      
      // Сохраняем telegram_id в localStorage сразу после успешного логина
      // Это гарантирует, что роутер увидит аутентифицированного пользователя
      localStorage.setItem('telegram_id', response.telegram_id)
      console.log('AuthBlock: Saved telegram_id to localStorage:', response.telegram_id)
      console.log('AuthBlock: Verified localStorage:', localStorage.getItem('telegram_id'))

      // Вызываем login(), но не ждем его завершения, чтобы не блокировать редирект
      // login() может получить ошибку при получении данных пользователя, но это не критично
      login(response.telegram_id).catch((err) => {
        console.warn('AuthBlock: Ошибка при получении данных пользователя, но продолжаем:', err)
        // НЕ очищаем localStorage при ошибке получения данных пользователя
        // Токен уже установлен, пользователь аутентифицирован
      })
      
      setIsLoading(false)
      closeAuth()
      
      // Проверяем, что localStorage сохранен перед редиректом
      const savedId = localStorage.getItem('telegram_id')
      console.log('AuthBlock: Before redirect, localStorage telegram_id:', savedId)
      
      if (!savedId) {
        console.error('AuthBlock: ERROR - telegram_id not in localStorage before redirect!')
        // Сохраняем еще раз на всякий случай
        localStorage.setItem('telegram_id', response.telegram_id)
      }
      
      // Используем небольшую задержку перед редиректом, чтобы гарантировать сохранение
      setTimeout(() => {
        const finalCheck = localStorage.getItem('telegram_id')
        console.log('AuthBlock: Final check before redirect, localStorage telegram_id:', finalCheck)
        if (finalCheck) {
          console.log('AuthBlock: Redirecting to /hackatons')
          window.location.href = '/hackatons'
        } else {
          console.error('AuthBlock: ERROR - telegram_id still not in localStorage! Saving again...')
          localStorage.setItem('telegram_id', response.telegram_id)
          window.location.href = '/hackatons'
        }
      }, 100)
    } catch (err: any) {
      console.error('Login error:', err)
      setIsLoading(false)
      const errorMessage = err?.response?.data?.detail || err?.message || 'Ошибка при входе. Проверьте код и попробуйте снова.'
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
            {error && (
              <div className={styles.auth__error}>
                {error}
              </div>
            )}
            <button
              type="submit"
              className={styles.auth__button}
              disabled={isLoading || !code.trim()}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          <p className={styles.auth__desc_bot}>
            Напишите <a href="https://t.me/MopsMopsMops_bot" target="_blank" rel="noopener noreferrer">бот</a>, чтобы получить код
          </p>
        </div>
      </div>
    </div>
  )
}
