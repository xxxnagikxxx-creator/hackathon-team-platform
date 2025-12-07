import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../../../entities/User'
import { apiClient } from '../../../shared/config/api'
import { authService } from '../../../features/Auth/authService'

// Backend UserInfo type
type BackendUserInfo = {
  telegram_id: string
  fullname: string
  username?: string | null  // Добавляем username
  pic: string
  role?: string | null
  description?: string | null
  tags?: string[] | null
}

type UserContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  telegramId: string | null
  login: (telegramId: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Маппер для преобразования Backend UserInfo в Frontend User
function mapUserInfoToUser(userInfo: BackendUserInfo): User {
  // Преобразуем base64 в data URL для отображения
  const avatarUrl = userInfo.pic 
    ? (userInfo.pic.startsWith('data:') ? userInfo.pic : `data:image/jpeg;base64,${userInfo.pic}`)
    : undefined

  // Используем username, если он есть, иначе fullname, иначе "Пользователь"
  const userName = (userInfo.username && userInfo.username.trim() !== '') 
    ? userInfo.username.trim() 
    : (userInfo.fullname && userInfo.fullname.trim() !== '') 
      ? userInfo.fullname.trim() 
      : 'Пользователь'
  
  console.log('mapUserInfoToUser: Маппинг имени:', {
    username: userInfo.username,
    fullname: userInfo.fullname,
    mapped: userName,
  })
  
  return {
    id: parseInt(userInfo.telegram_id) || 0, // Временное решение
    email: '', // Нет на бэке
    name: userName,
    avatarUrl,
    avatarSrc: avatarUrl,
    role: (userInfo.role as 'participant' | 'organizer' | 'admin') || 'participant',
    createdAt: new Date().toISOString(), // Нет на бэке
  }
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [telegramId, setTelegramId] = useState<string | null>(() => {
    // Сохраняем telegram_id в localStorage для проверки при перезагрузке
    return localStorage.getItem('telegram_id')
  })

  // Проверяем аутентификацию при загрузке приложения
  useEffect(() => {
    // Всегда читаем telegramId из localStorage при загрузке
    const storedTelegramId = localStorage.getItem('telegram_id')
    console.log('UserProvider: Initializing, storedTelegramId:', storedTelegramId, 'current telegramId in state:', telegramId)
    
    // telegramId уже инициализирован из localStorage в useState
    // Но убеждаемся, что он установлен в state
    if (storedTelegramId && !telegramId) {
      // Обновляем state, если в localStorage есть значение, но в state его нет
      setTelegramId(storedTelegramId)
      console.log('UserProvider: telegramId set to:', storedTelegramId)
    }
    
    if (storedTelegramId) {
      // Проверяем аутентификацию асинхронно
      // Используем storedTelegramId напрямую, чтобы гарантировать актуальность
      checkAuth(storedTelegramId)
    } else {
      console.log('UserProvider: No telegramId in localStorage, setting isLoading to false')
      setIsLoading(false)
    }
  }, [])

  const checkAuth = async (telegramIdParam?: string) => {
    // Используем переданный telegramId или из state, или из localStorage
    const idToCheck = telegramIdParam || telegramId || localStorage.getItem('telegram_id')
    console.log('UserProvider: checkAuth called with idToCheck:', idToCheck)
    
    if (!idToCheck) {
      console.log('UserProvider: No idToCheck, setting isLoading to false')
      setIsLoading(false)
      return
    }

    // Сначала проверяем наличие токена через попытку запроса к защищенному эндпоинту
    // POST /participants/{telegram_id} требует аутентификации и вернет 401, если токена нет
    console.log('UserProvider: Checking token validity by attempting to access protected endpoint')
    try {
      // Пробуем сделать запрос к защищенному эндпоинту для проверки токена
      // Используем минимальные данные, так как нас интересует только проверка токена
      await apiClient.post(`/participants/${idToCheck}`, {
        fullname: '',
        role: null,
        description: null,
        tags: null,
      }, {
        validateStatus: (status: number) => {
          // Принимаем только 200-299 и 400, 404 как нормальные ответы
          // 401/403 должны вызвать ошибку, чтобы мы могли их обработать
          return (status >= 200 && status < 300) || status === 400 || status === 404
        }
      })
      console.log('UserProvider: Token is valid (no 401/403 error)')
    } catch (tokenError: any) {
      if (tokenError?.response?.status === 401 || tokenError?.response?.status === 403) {
        console.log('UserProvider: Token отсутствует или невалиден (401/403), очищаем данные')
        setUser(null)
        setTelegramId(null)
        localStorage.removeItem('telegram_id')
        setIsLoading(false)
        return
      }
      // Другие ошибки (сетевые и т.д.) - считаем, что токен может быть валиден
      console.log('UserProvider: Token check error (not 401/403):', tokenError?.response?.status || 'network error', '- continuing')
    }

    try {
      console.log('UserProvider: Calling refreshUser with idToCheck:', idToCheck)
      // При проверке аутентификации при загрузке НЕ очищаем localStorage при 404
      // Токен может быть валиден (в cookies), но пользователь еще не зарегистрирован
      // clearOn404 = false означает, что при 404 мы НЕ очищаем telegramId и localStorage
      await refreshUser(idToCheck, false)
      console.log('UserProvider: refreshUser completed successfully')
    } catch (error: any) {
      // Пользователь не аутентифицирован или токен невалидный
      console.error('UserProvider: Ошибка проверки аутентификации:', error)
      // Если получили 401/403, значит токена нет или он невалидный - очищаем данные
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log('UserProvider: Токен отсутствует или невалиден, очищаем данные')
        setUser(null)
        setTelegramId(null)
        localStorage.removeItem('telegram_id')
      }
      // refreshUser уже обработал очистку данных при 401/403
      // Здесь просто логируем другие ошибки
    } finally {
      console.log('UserProvider: checkAuth finally, setting isLoading to false')
      setIsLoading(false)
    }
  }

  const refreshUser = async (telegramIdParam?: string, clearOn404: boolean = true) => {
    // Используем переданный telegramId или из state
    const idToUse = telegramIdParam || telegramId
    
    if (!idToUse) {
      // Если telegramId не установлен, просто возвращаемся без ошибки
      // Это нормальная ситуация для неаутентифицированных пользователей
      return
    }

    try {
      // Получаем пользователя по telegram_id через /api/participants/{telegram_id}
      const response = await apiClient.get<BackendUserInfo>(`/participants/${idToUse}`)
      const userData = mapUserInfoToUser(response.data)
      setUser(userData)
      console.log('UserContext: refreshUser() - User data loaded successfully')
    } catch (error: any) {
      console.error('UserContext: refreshUser() - Ошибка получения пользователя:', error)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        // Токен невалидный или истек - очищаем данные
        console.log('UserContext: refreshUser() - Токен невалидный или отсутствует (401/403), очищаем данные')
        setUser(null)
        setTelegramId(null)
        localStorage.removeItem('telegram_id')
        // Пробрасываем ошибку дальше, чтобы checkAuth мог её обработать
        throw error
      } else if (error?.response?.status === 404) {
        // Пользователь не найден
        console.log('UserContext: refreshUser() - Пользователь не найден (404)')
        setUser(null)
        // НЕ очищаем telegramId и localStorage при 404, если clearOn404 = false
        // Это может быть нормальная ситуация, если пользователь еще не зарегистрирован
        // но токен валиден (установлен в cookies)
        if (clearOn404) {
          console.log('UserContext: refreshUser() - Очищаем данные при 404 (clearOn404=true)')
          setTelegramId(null)
          localStorage.removeItem('telegram_id')
        } else {
          console.log('UserContext: refreshUser() - НЕ очищаем данные при 404 (clearOn404=false), токен может быть валиден')
        }
      } else {
        console.warn('UserContext: refreshUser() - Не удалось обновить данные пользователя, но продолжаем работу')
      }
    }
  }

  const login = async (telegramIdParam: string) => {
    // Сохраняем telegram_id для последующих запросов
    // Это делаем в первую очередь, чтобы гарантировать сохранение даже при ошибке
    setTelegramId(telegramIdParam)
    localStorage.setItem('telegram_id', telegramIdParam)
    console.log('UserContext: login() - Saved telegram_id to localStorage:', telegramIdParam)
    
    try {
      // Получаем информацию о пользователе, передавая telegramId напрямую
      // чтобы избежать использования старого значения из state
      // НЕ используем refreshUser(), так как он может очистить localStorage при ошибке
      // Вместо этого делаем запрос напрямую
      const response = await apiClient.get<BackendUserInfo>(`/participants/${telegramIdParam}`)
      const userData = mapUserInfoToUser(response.data)
      setUser(userData)
      console.log('UserContext: login() - User data loaded successfully')
    } catch (error: any) {
      console.error('UserContext: login() - Ошибка при получении данных пользователя:', error)
      // НЕ очищаем telegramId при ошибке получения данных пользователя
      // Токен уже установлен, пользователь аутентифицирован
      // Данные пользователя можно получить позже через refreshUser()
      // Не выбрасываем ошибку, чтобы не блокировать редирект
      
      // Только очищаем localStorage при критических ошибках (401/403)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.warn('UserContext: login() - Токен невалидный, но продолжаем (возможно, токен еще не установлен в cookies)')
        // НЕ очищаем localStorage, так как токен может быть установлен в cookies
      }
    }
  }

  const logout = async () => {
    try {
      // Вызываем API для удаления токенов из cookies
      await authService.logout()
      
      setUser(null)
      setTelegramId(null)
      localStorage.removeItem('telegram_id')
    } catch (error) {
      console.error('Ошибка при выходе:', error)
      setUser(null)
      setTelegramId(null)
      localStorage.removeItem('telegram_id')
      throw error
    }
  }

  // isAuthenticated = true только если есть user (что означает успешный запрос с валидным токеном)
  // НЕ используем только localStorage или telegramId, так как токен может отсутствовать
  // Если токен отсутствует или невалиден, refreshUser очистит данные и user будет null
  const isAuthenticated = !!user
  
  // Логирование для отладки
  useEffect(() => {
    const storedId = localStorage.getItem('telegram_id')
    console.log('UserProvider: isAuthenticated =', isAuthenticated, 'user =', user, 'telegramId =', telegramId, 'storedId =', storedId, 'isLoading =', isLoading)
  }, [isAuthenticated, user, telegramId, isLoading])

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        isLoading,
        telegramId,
        login, 
        logout,
        refreshUser
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

