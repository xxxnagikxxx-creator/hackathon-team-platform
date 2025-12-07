import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { adminAuthService } from '../../../features/AdminAuth/adminAuthService'

type AdminContextType = {
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Проверяем аутентификацию при загрузке приложения
  useEffect(() => {
    // Проверяем sessionStorage для быстрой проверки
    const stored = sessionStorage.getItem('admin_authenticated')
    if (stored === 'true') {
      setIsAuthenticated(true)
      setIsLoading(false)
    } else {
      checkAuth()
    }
  }, [])

  const checkAuth = async () => {
    setIsLoading(true)
    // Проверяем sessionStorage для определения статуса авторизации
    const stored = sessionStorage.getItem('admin_authenticated')
    setIsAuthenticated(stored === 'true')
    setIsLoading(false)
  }

  const login = async () => {
    // После успешного логина устанавливаем авторизацию
    setIsAuthenticated(true)
    setIsLoading(false)
    // Сохраняем флаг авторизации в sessionStorage для проверки при перезагрузке
    sessionStorage.setItem('admin_authenticated', 'true')
  }

  const logout = async () => {
    try {
      await adminAuthService.logout()
      setIsAuthenticated(false)
      sessionStorage.removeItem('admin_authenticated')
      // Редирект на главную страницу
      window.location.href = '/'
    } catch (error) {
      console.error('Ошибка при выходе админа:', error)
      setIsAuthenticated(false)
      sessionStorage.removeItem('admin_authenticated')
      window.location.href = '/'
      throw error
    }
  }

  return (
    <AdminContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
