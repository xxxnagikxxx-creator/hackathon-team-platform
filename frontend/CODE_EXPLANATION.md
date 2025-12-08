# 📚 ПОЛНОЕ ОБЪЯСНЕНИЕ КОДА FRONTEND ПРОЕКТА

## 📋 ОГЛАВЛЕНИЕ
1. [Список всех используемых технологий](#технологии)
2. [Структура проекта и архитектура](#архитектура)
3. [Пошаговое объяснение каждого файла](#пошаговое-объяснение)
4. [API запросы - полный разбор](#api-запросы)
5. [React Hooks - детальное объяснение](#react-hooks)
6. [Потоки данных в приложении](#потоки-данных)

---

## 🛠️ ТЕХНОЛОГИИ И НАВЫКИ

### Базовые технологии:
- ✅ **JavaScript (ES6+)** - синтаксис языка
- ✅ **TypeScript** - типизация кода
- ✅ **React** - библиотека для создания UI
- ✅ **Vite** - сборщик и dev-сервер
- ✅ **Axios** - HTTP клиент для запросов
- ✅ **React Router DOM** - навигация по страницам
- ✅ **SCSS/CSS Modules** - стилизация

### React Hooks (все используемые):
- ✅ **useState** - локальное состояние компонента
- ✅ **useEffect** - побочные эффекты (загрузка данных, подписки)
- ✅ **useContext** - доступ к глобальному контексту
- ✅ **useMemo** - мемоизация вычислений
- ✅ **useCallback** - мемоизация функций

### React Router:
- ✅ **BrowserRouter** - роутер для SPA
- ✅ **Routes** - контейнер для маршрутов
- ✅ **Route** - один маршрут
- ✅ **NavLink** - навигационная ссылка
- ✅ **useNavigate** - хук для программной навигации
- ✅ **useParams** - получение параметров из URL
- ✅ **useLocation** - получение текущего URL

### React Query (@tanstack/react-query):
- ✅ **QueryClient** - клиент для управления запросами
- ✅ **QueryClientProvider** - провайдер React Query
- ✅ **useQuery** - хук для загрузки данных
- ✅ **useMutation** - хук для изменения данных
- ✅ **useQueryClient** - доступ к QueryClient
- ✅ **invalidateQueries** - обновление кеша

### Другие:
- ✅ **Context API** - глобальное состояние
- ✅ **localStorage** - локальное хранилище
- ✅ **Promises / async-await** - асинхронность
- ✅ **Array methods** (map, filter, find, some, forEach)
- ✅ **Object destructuring** - деструктуризация
- ✅ **Spread operator** - оператор расширения
- ✅ **Optional chaining** (?.)
- ✅ **Template literals** - шаблонные строки

---

## 🏗️ АРХИТЕКТУРА ПРОЕКТА (FSD)

### Слои от общего к частному:

```
app/           - Инициализация приложения (роутинг, провайдеры)
pages/         - Полноценные страницы
widgets/       - Большие составные блоки (Header, Sidebar, Cards)
features/      - Бизнес-функции (Auth, TeamManagement, ProfileEdit)
entities/      - Бизнес-сущности (User, Hackathon, Team, Participant)
shared/        - Переиспользуемые компоненты и утилиты
```

---

## 📝 ПОШАГОВОЕ ОБЪЯСНЕНИЕ КАЖДОГО ФАЙЛА

### 1. ТОЧКА ВХОДА: `main.tsx`

**Технологии**: React, React Query, DOM API

```typescript
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './app/App.tsx'

// Создаем клиент React Query с настройками
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,  // Не перезагружать данные при фокусе окна
      retry: 1,                      // Повторить запрос 1 раз при ошибке
    },
  },
})

// Находим элемент root в HTML и монтируем React приложение
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
```

**Что происходит**:
1. `createRoot` - создает корневой элемент React 18
2. `QueryClientProvider` - оборачивает приложение для работы с React Query
3. `queryClient` - хранит настройки и кеш для всех запросов
4. `render` - отрисовывает компонент `App` в DOM

---

### 2. ГЛАВНЫЙ КОМПОНЕНТ: `app/App.tsx`

**Технологии**: React, Context API

```typescript
import './mainStyles/main.scss'
import './mainStyles/reset.css'
import { UserProvider } from './providers/UserProvider'
import { AdminProvider } from './providers/AdminProvider'
import AppRouter from './router/router'

function App() {
  return (
    <UserProvider>
      <AdminProvider>
        <AppRouter />
      </AdminProvider>
    </UserProvider>
  )
}
```

**Что происходит**:
- `UserProvider` - оборачивает приложение, чтобы все компоненты имели доступ к данным пользователя
- `AdminProvider` - аналогично для админ-панели
- `AppRouter` - роутер, который решает какую страницу показать

**Зачем провайдеры**:
Провайдеры создают контекст (Context), который позволяет передавать данные через все компоненты без передачи props.

---

### 3. РОУТИНГ: `app/router/router.tsx`

**Технологии**: React Router DOM, Context API, React Hooks (useUser, useState)

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from '../../widgets/Header'
import { Home } from '../../pages/Home'
import { useUser } from '../providers/UserProvider'

function AppRouter() {
  const { isAuthenticated, isLoading } = useUser()

  // Показываем загрузку пока проверяется аутентификация
  if (isLoading) {
    return (
      <BrowserRouter>
        <div className="app">
          <Header />
          <main className="app__content">
            <div>Загрузка...</div>
          </main>
        </div>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        {isAuthenticated && (
          <div className="app__layout">
            <Sidebar />
            <main className="app__content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/hackatons" element={<Hackatons />} />
                <Route path="/hackatons/:id" element={<HackathonDetail />} />
                <Route path="/participants" element={<Participants />} />
                {/* ... другие маршруты */}
              </Routes>
            </main>
          </div>
        )}
        {!isAuthenticated && (
          <main className="app__content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/*" element={<Home />} />
            </Routes>
          </main>
        )}
      </div>
    </BrowserRouter>
  )
}
```

**Что происходит**:

1. **`BrowserRouter`** - обертка для работы роутера в браузере
2. **`useUser()`** - хук для получения данных пользователя из контекста
   - `isAuthenticated` - авторизован ли пользователь
   - `isLoading` - идет ли проверка авторизации
3. **`Routes`** - контейнер для всех маршрутов
4. **`Route`** - один маршрут:
   - `path="/"` - URL путь
   - `element={<Home />}` - компонент, который показать
   - `path="/hackatons/:id"` - динамический параметр `id`
5. **Условный рендеринг**:
   - Если `isAuthenticated === true` - показываем Sidebar и защищенные страницы
   - Если `isAuthenticated === false` - показываем только Home

**Маршруты**:
- `/` - главная страница
- `/hackatons` - список хакатонов
- `/hackatons/:id` - детали хакатона (id берется из URL)
- `/participants` - список участников
- `/participants/:id` - профиль участника
- `/teams` - список команд
- `/teams/:id` - детали команды
- `/profile` - профиль текущего пользователя
- `/notifications` - уведомления
- `/*` - любой другой путь (404 страница)

---

### 4. ПРОВАЙДЕР ПОЛЬЗОВАТЕЛЯ: `app/providers/UserProvider/UserContext.tsx`

**Технологии**: React Context API, React Hooks (useState, useEffect, useContext), Axios, localStorage

Это один из самых сложных файлов. Разберем по частям:

#### 4.1. Типы данных

```typescript
type UserContextType = {
  user: User | null              // Данные пользователя или null
  isAuthenticated: boolean       // Авторизован ли
  isLoading: boolean             // Идет ли загрузка
  telegramId: string | null      // ID пользователя из Telegram
  login: (telegramId: string) => Promise<void>  // Функция входа
  logout: () => Promise<void>    // Функция выхода
  refreshUser: () => Promise<void>  // Обновить данные пользователя
}
```

#### 4.2. Создание контекста

```typescript
const UserContext = createContext<UserContextType | undefined>(undefined)
```

**Что это**: Создает "контейнер" для хранения данных, доступных всем дочерним компонентам.

#### 4.3. Компонент провайдера

```typescript
export const UserProvider = ({ children }: { children: ReactNode }) => {
  // Локальное состояние компонента
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [telegramId, setTelegramId] = useState<string | null>(() => {
    // Читаем из localStorage при инициализации
    return localStorage.getItem('telegram_id')
  })

  // Проверяем аутентификацию при загрузке приложения
  useEffect(() => {
    const storedTelegramId = localStorage.getItem('telegram_id')
    
    if (storedTelegramId) {
      // Если есть ID в localStorage - проверяем авторизацию
      checkAuth(storedTelegramId)
    } else {
      setIsLoading(false)
    }
  }, [])  // Пустой массив = выполнить один раз при монтировании
```

**Что происходит**:
- `useState` - создает состояние:
  - `user` - данные пользователя
  - `isLoading` - флаг загрузки
  - `telegramId` - ID из localStorage
- `useEffect` - выполняется после первого рендера:
  - Читает `telegram_id` из localStorage
  - Если есть - вызывает `checkAuth()`

#### 4.4. Функция проверки авторизации

```typescript
const checkAuth = async (telegramIdParam?: string) => {
  const idToCheck = telegramIdParam || telegramId || localStorage.getItem('telegram_id')
  
  if (!idToCheck) {
    setIsLoading(false)
    return
  }

  // Проверяем валидность токена через запрос к защищенному эндпоинту
  try {
    await apiClient.post(`/participants/${idToCheck}`, {
      fullname: '',
      role: null,
      description: null,
      tags: null,
    }, {
      validateStatus: (status: number) => {
        return (status >= 200 && status < 300) || status === 400 || status === 404
      }
    })
  } catch (tokenError: any) {
    if (tokenError?.response?.status === 401 || tokenError?.response?.status === 403) {
      // Токен невалидный - очищаем данные
      setUser(null)
      setTelegramId(null)
      localStorage.removeItem('telegram_id')
      setIsLoading(false)
      return
    }
  }

  try {
    // Загружаем данные пользователя
    await refreshUser(idToCheck, false)
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      setUser(null)
      setTelegramId(null)
      localStorage.removeItem('telegram_id')
    }
  } finally {
    setIsLoading(false)
  }
}
```

**Что происходит**:
1. Получаем `telegramId` из параметра, state или localStorage
2. Проверяем валидность токена (делаем тестовый запрос)
3. Если токен валиден - загружаем данные пользователя
4. Если токен невалиден (401/403) - очищаем данные

#### 4.5. Функция обновления данных пользователя

```typescript
const refreshUser = async (telegramIdParam?: string, clearOn404: boolean = true) => {
  const idToUse = telegramIdParam || telegramId
  
  if (!idToUse) {
    return
  }

  try {
    // GET запрос к API для получения данных пользователя
    const response = await apiClient.get<BackendUserInfo>(`/participants/${idToUse}`)
    const userData = mapUserInfoToUser(response.data)
    setUser(userData)  // Сохраняем в состояние
  } catch (error: any) {
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      // Токен невалиден - очищаем
      setUser(null)
      setTelegramId(null)
      localStorage.removeItem('telegram_id')
      throw error
    } else if (error?.response?.status === 404) {
      // Пользователь не найден
      setUser(null)
      if (clearOn404) {
        setTelegramId(null)
        localStorage.removeItem('telegram_id')
      }
    }
  }
}
```

**Что происходит**:
1. Делает GET запрос `/participants/{telegram_id}`
2. Преобразует данные бэкенда в формат фронтенда
3. Сохраняет в состояние `user`
4. Обрабатывает ошибки (401 - неавторизован, 404 - не найден)

#### 4.6. Функция входа

```typescript
const login = async (telegramIdParam: string) => {
  // Сохраняем telegram_id
  setTelegramId(telegramIdParam)
  localStorage.setItem('telegram_id', telegramIdParam)
  
  try {
    // Загружаем данные пользователя
    const response = await apiClient.get<BackendUserInfo>(`/participants/${telegramIdParam}`)
    const userData = mapUserInfoToUser(response.data)
    setUser(userData)
  } catch (error: any) {
    // Обработка ошибок
    console.error('Ошибка при получении данных пользователя:', error)
  }
}
```

#### 4.7. Функция выхода

```typescript
const logout = async () => {
  try {
    // Вызываем API для удаления токена из cookies
    await authService.logout()
    
    setUser(null)
    setTelegramId(null)
    localStorage.removeItem('telegram_id')
  } catch (error) {
    console.error('Ошибка при выходе:', error)
    // Очищаем локально даже при ошибке
    setUser(null)
    setTelegramId(null)
    localStorage.removeItem('telegram_id')
  }
}
```

#### 4.8. Хук для использования контекста

```typescript
export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
```

**Что это**: Кастомный хук для удобного доступа к контексту. Выдает ошибку, если используется вне провайдера.

---

### 5. КОНФИГУРАЦИЯ API: `shared/config/api.ts`

**Технологии**: Axios, Environment Variables

```typescript
import axios from 'axios'

const isDevelopment = import.meta.env.DEV

// Базовый URL для API
export const API_BASE_URL = isDevelopment
  ? '/api'  // В разработке - проксируется через Vite
  : import.meta.env.VITE_API_URL || 'http://backend:8000'

// Создаем экземпляр axios
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Отправлять cookies (для токенов)
})

// Interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method?.toUpperCase(), response.config.url)
    return response
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
    })
    return Promise.reject(error)
  }
)
```

**Что происходит**:
- `axios.create()` - создает экземпляр axios с базовыми настройками
- `baseURL` - базовый URL для всех запросов
- `withCredentials: true` - отправлять cookies при каждом запросе
- `interceptors` - перехватчики:
  - Логируют все запросы/ответы
  - Обрабатывают ошибки

---

### 6. СТРАНИЦА СПИСКА ХАКАТОНОВ: `pages/Hackathons/Hackathons.tsx`

**Технологии**: React Hooks (useState, useQuery), React Router (useNavigate), React Query

```typescript
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hackathonService } from '../../entities/Hackathon'
import { useUser } from '../../app/providers/UserProvider'

export const Hackatons = () => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const navigate = useNavigate()
  const { user } = useUser()
  const isOrganizer = user?.role === 'organizer'

  // Загрузка списка хакатонов
  const { data: hackathons, isLoading } = useQuery({
    queryKey: ['hackathons'],
    queryFn: () => hackathonService.getAll(),
  })

  if (isLoading) {
    return <div>Загрузка хакатонов...</div>
  }

  return (
    <div>
      <h2>Хакатоны</h2>
      
      {isOrganizer && (
        <button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Отмена' : '+ Создать хакатон'}
        </button>
      )}

      {showCreateForm && <CreateHackathon onSuccess={() => setShowCreateForm(false)} />}

      <div>
        {hackathons?.map((hackathon) => (
          <HackatonCard
            key={hackathon.id}
            id={hackathon.id}
            title={hackathon.title}
            onParticipate={() => navigate(`/hackatons/${hackathon.id}`)}
          />
        ))}
      </div>
    </div>
  )
}
```

**Что происходит**:

1. **`useState(false)`** - создает состояние `showCreateForm` (начальное значение `false`)
2. **`useNavigate()`** - хук для программной навигации
3. **`useUser()`** - получает данные текущего пользователя
4. **`useQuery`** - хук React Query для загрузки данных:
   - `queryKey: ['hackathons']` - ключ кеша
   - `queryFn: () => hackathonService.getAll()` - функция для загрузки
   - `data` - загруженные данные
   - `isLoading` - флаг загрузки
5. **Условный рендеринг**:
   - Если `isLoading === true` - показываем "Загрузка..."
   - Если `isOrganizer === true` - показываем кнопку создания
   - Отображаем список хакатонов через `map()`

**Как работает `useQuery`**:
1. При первом рендере вызывает `hackathonService.getAll()`
2. Показывает `isLoading = true` во время загрузки
3. Сохраняет результат в кеш по ключу `['hackathons']`
4. При повторном вызове берет из кеша (не делает новый запрос)

---

### 7. СТРАНИЦА ДЕТАЛЕЙ ХАКАТОНА: `pages/HackathonDetail/HackathonDetail.tsx`

**Технологии**: React Hooks (useState, useQuery), React Router (useParams, useNavigate)

```typescript
export const HackathonDetail = () => {
  const { id } = useParams<{ id: string }>()  // Получаем ID из URL
  const navigate = useNavigate()
  const { user } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const isOrganizer = user?.role === 'organizer'

  // Загружаем данные хакатона по ID
  const { data: hackathon, isLoading } = useQuery({
    queryKey: ['hackathon', id],
    queryFn: () => hackathonService.getById(Number(id)),
    enabled: !!id,  // Запрос выполнится только если id существует
  })

  if (isLoading) {
    return <div>Загрузка хакатона...</div>
  }

  if (!hackathon) {
    return <div>Хакатон не найден</div>
  }

  return (
    <div>
      <button onClick={() => navigate('/hackatons')}>Назад</button>
      
      <img src={hackathon.imageUrl} alt={hackathon.title} />
      <h1>{hackathon.title}</h1>
      
      {isOrganizer && (
        <button onClick={() => setIsEditing(true)}>
          Редактировать
        </button>
      )}

      <p>{hackathon.description}</p>
      
      {user && !isOrganizer && (
        <button onClick={() => setShowTeamModal(true)}>
          Присоединиться
        </button>
      )}
    </div>
  )
}
```

**Что происходит**:

1. **`useParams()`** - получает параметры из URL:
   - Если URL `/hackatons/123`, то `id = "123"`
2. **`useQuery`** с `queryKey: ['hackathon', id]`:
   - Кеш уникален для каждого `id`
   - `enabled: !!id` - запрос выполнится только если `id` есть
3. **Условный рендеринг**:
   - Показываем кнопку редактирования только организаторам
   - Показываем кнопку "Присоединиться" только авторизованным пользователям

---

### 8. СТРАНИЦА УЧАСТНИКОВ С ФИЛЬТРАМИ: `pages/Participants/Participants.tsx`

**Технологии**: React Hooks (useState, useMemo, useQuery, useMutation), React Query

```typescript
export const Participants = () => {
  // Локальное состояние для фильтров
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  
  const { user } = useUser()
  const queryClient = useQueryClient()

  // Загрузка участников
  const { data: participants, isLoading } = useQuery({
    queryKey: ['participants'],
    queryFn: () => participantService.getAll(),
  })

  // Загрузка команд
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.getAll(),
    enabled: !!user,  // Загружать только если пользователь авторизован
  })

  // Мутация для приглашения участника
  const inviteMutation = useMutation({
    mutationFn: ({ teamId, participantId }) =>
      teamService.inviteMember({ teamId, participantId }),
    onSuccess: () => {
      // После успеха обновляем кеш команд
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      alert('Приглашение отправлено!')
    },
  })

  // Вычисляем все уникальные навыки
  const allSkills = useMemo(() => {
    if (!participants) return []
    const skillsSet = new Set<string>()
    participants.forEach(p => {
      p.skills?.forEach(skill => skillsSet.add(skill))
    })
    return Array.from(skillsSet).sort()
  }, [participants])

  // Фильтруем участников
  const filteredParticipants = useMemo(() => {
    if (!participants) return []
    if (selectedSkills.length === 0) return participants
    
    return participants.filter(p => 
      p.skills?.some(skill => selectedSkills.includes(skill))
    )
  }, [participants, selectedSkills])

  // Переключение навыка в фильтре
  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)  // Убрать
        : [...prev, skill]                // Добавить
    )
  }

  return (
    <div>
      {/* Фильтр по навыкам */}
      <div>
        {allSkills.map(skill => (
          <button
            key={skill}
            className={selectedSkills.includes(skill) ? 'active' : ''}
            onClick={() => toggleSkill(skill)}
          >
            {skill}
          </button>
        ))}
      </div>

      {/* Список участников */}
      {filteredParticipants.map(participant => (
        <ParticipantCard key={participant.id} {...participant} />
      ))}
    </div>
  )
}
```

**Что происходит**:

1. **`useState<string[]>([])`** - массив выбранных навыков
2. **`useQuery` для участников** - загружает всех участников
3. **`useQuery` для команд** - загружает команды (только для авторизованных)
4. **`useMutation`** - для отправки приглашения:
   - `mutationFn` - функция, которая выполняется при `mutate()`
   - `onSuccess` - вызывается после успеха, обновляет кеш
5. **`useMemo` для `allSkills`**:
   - Собирает все уникальные навыки из участников
   - Использует `Set` для уникальности
   - Пересчитывается только при изменении `participants`
6. **`useMemo` для `filteredParticipants`**:
   - Фильтрует участников по выбранным навыкам
   - Пересчитывается при изменении `participants` или `selectedSkills`
7. **`toggleSkill`**:
   - Если навык уже выбран - убирает из массива
   - Если не выбран - добавляет в массив
   - Использует `spread operator` для создания нового массива

**Почему `useMemo`**:
- Оптимизация: тяжелые вычисления выполняются только при изменении зависимостей
- Без `useMemo` фильтрация выполнялась бы при каждом рендере

---

### 9. API СЕРВИС: `entities/Hackathon/api/service.ts`

**Технологии**: Axios, TypeScript, Promises, async/await

```typescript
import { apiClient } from '../../../shared/config/api'

export const hackathonService = {
  // Получить все хакатоны
  async getAll(): Promise<Hackathon[]> {
    try {
      // GET запрос к API
      const response = await apiClient.get<BackendHackInfo[]>('/hackathons')
      
      // Преобразуем данные бэкенда в формат фронтенда
      return response.data.map(mapBackendHackToHackathon)
    } catch (error) {
      console.error('Ошибка загрузки хакатонов:', error)
      throw error
    }
  },

  // Получить хакатон по ID
  async getById(id: number): Promise<Hackathon> {
    try {
      const response = await apiClient.get<BackendHackInfo>(`/hackathons/${id}`)
      return mapBackendHackToHackathon(response.data)
    } catch (error) {
      console.error('Ошибка загрузки хакатона:', error)
      throw error
    }
  },

  // Создать хакатон
  async create(data: CreateHackathonDto): Promise<Hackathon> {
    // Преобразуем данные фронтенда в формат бэкенда
    const backendData = mapCreateHackathonToBackend(data)
    
    // POST запрос для создания
    const response = await apiClient.post<BackendHackInfo>('/hackathons', backendData)
    return mapBackendHackToHackathon(response.data)
  },
}
```

**Что происходит**:

1. **`async/await`** - асинхронные функции:
   - `async` - функция возвращает Promise
   - `await` - ждет выполнения Promise
2. **`apiClient.get()`** - GET запрос (получение данных)
3. **`apiClient.post()`** - POST запрос (создание)
4. **Маппинг данных**:
   - Бэкенд возвращает `BackendHackInfo`
   - Преобразуем в `Hackathon` (формат фронтенда)
5. **Обработка ошибок**:
   - `try/catch` - перехватывает ошибки
   - `throw error` - пробрасывает ошибку дальше

**Типы HTTP запросов**:
- **GET** - получить данные (`/hackathons`, `/hackathons/123`)
- **POST** - создать (`/hackathons` + body)
- **PATCH** - обновить (`/hackathons/123` + body)
- **DELETE** - удалить (`/hackathons/123`)

---

### 10. АВТОРИЗАЦИЯ: `features/Auth/authService.ts`

**Технологии**: Axios, TypeScript, Promises

```typescript
import { apiClient } from '../../shared/config/api'

export const authService = {
  // Вход по коду из Telegram
  async loginByCode(code: string): Promise<LoginByCodeResponse> {
    try {
      // POST запрос с кодом
      const response = await apiClient.post<LoginByCodeResponse>('/login-by-code', {
        code: code.trim(),
      })
      return response.data
    } catch (error: any) {
      console.error('Ошибка входа:', error)
      throw error
    }
  },

  // Выход
  async logout(): Promise<LogoutResponse> {
    const response = await apiClient.post<LogoutResponse>('/logout')
    return response.data
  },
}
```

**Что происходит**:
1. Пользователь получает код из Telegram бота
2. Вводит код в форму
3. Отправляется POST `/login-by-code` с кодом
4. Бэкенд проверяет код и создает токен
5. Токен сохраняется в cookies автоматически (благодаря `withCredentials: true`)

---

### 11. ФОРМА АВТОРИЗАЦИИ: `widgets/AuthBlock/ui/AuthBlock.tsx`

**Технологии**: React Hooks (useState), async/await, localStorage

```typescript
export const AuthBlock = ({ closeAuth }: Props) => {
  const [code, setCode] = useState('')  // Код из инпута
  const [isLoading, setIsLoading] = useState(false)  // Загрузка
  const [error, setError] = useState<string | null>(null)  // Ошибка
  const { login } = useUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()  // Предотвращаем перезагрузку страницы
    
    if (!code.trim()) {
      setError('Введите код')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Отправляем код на бэкенд
      const response = await authService.loginByCode(code)
      
      // Сохраняем telegram_id
      localStorage.setItem('telegram_id', response.telegram_id)
      
      // Вызываем login() из UserProvider
      await login(response.telegram_id)
      
      setIsLoading(false)
      closeAuth()  // Закрываем форму
      
      // Редирект на страницу хакатонов
      window.location.href = '/hackatons'
    } catch (err: any) {
      setIsLoading(false)
      const errorMessage = err?.response?.data?.detail || 'Ошибка при входе'
      setError(errorMessage)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}  // Обновляем состояние
        placeholder="Введите код"
      />
      {error && <div>{error}</div>}
      <button type="submit" disabled={isLoading || !code.trim()}>
        {isLoading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  )
}
```

**Что происходит**:

1. **`useState('')`** - состояние для поля ввода кода
2. **`onChange={(e) => setCode(e.target.value)}`**:
   - При каждом изменении инпута вызывается функция
   - `e.target.value` - текущее значение инпута
   - `setCode()` - обновляет состояние
   - React перерисовывает компонент с новым значением
3. **`onSubmit={handleSubmit}`** - при отправке формы вызывается `handleSubmit`
4. **`e.preventDefault()`** - отменяет стандартное поведение формы (перезагрузку)
5. **Валидация** - проверяем, что код не пустой
6. **Асинхронный запрос** - отправляем код на сервер
7. **Обработка результата**:
   - При успехе - сохраняем ID, вызываем `login()`, делаем редирект
   - При ошибке - показываем сообщение об ошибке

---

## 🔄 API ЗАПРОСЫ - ПОЛНЫЙ РАЗБОР

### Структура запроса:

```
1. Компонент вызывает сервис
   ↓
2. Сервис делает запрос через apiClient
   ↓
3. apiClient отправляет HTTP запрос
   ↓
4. Vite проксирует на backend:8000
   ↓
5. Backend обрабатывает и возвращает JSON
   ↓
6. apiClient получает ответ
   ↓
7. Сервис преобразует данные
   ↓
8. Компонент получает данные через useQuery
```

### Пример 1: Получить список хакатонов

**Компонент**:
```typescript
const { data: hackathons } = useQuery({
  queryKey: ['hackathons'],
  queryFn: () => hackathonService.getAll(),
})
```

**Сервис**:
```typescript
async getAll(): Promise<Hackathon[]> {
  const response = await apiClient.get<BackendHackInfo[]>('/hackathons')
  return response.data.map(mapBackendHackToHackathon)
}
```

**Что происходит**:
1. `useQuery` вызывает `hackathonService.getAll()`
2. Сервис делает GET запрос на `/api/hackathons`
3. Vite проксирует на `http://backend:8000/hackathons`
4. Backend возвращает массив хакатонов
5. Преобразуем в формат фронтенда
6. `useQuery` сохраняет в кеш `['hackathons']`
7. Компонент получает данные в `data`

### Пример 2: Создать хакатон

**Компонент**:
```typescript
const mutation = useMutation({
  mutationFn: (data) => hackathonService.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['hackathons'] })
  },
})

mutation.mutate({ title: '...', description: '...' })
```

**Сервис**:
```typescript
async create(data: CreateHackathonDto): Promise<Hackathon> {
  const backendData = mapCreateHackathonToBackend(data)
  const response = await apiClient.post<BackendHackInfo>('/hackathons', backendData)
  return mapBackendHackToHackathon(response.data)
}
```

**Что происходит**:
1. Пользователь заполняет форму и нажимает "Создать"
2. Вызывается `mutation.mutate(data)`
3. `useMutation` вызывает `hackathonService.create(data)`
4. Сервис преобразует данные и делает POST запрос
5. Backend создает хакатон и возвращает его
6. `onSuccess` обновляет кеш (перезагружает список)

### Пример 3: Пригласить участника в команду

**Компонент**:
```typescript
const inviteMutation = useMutation({
  mutationFn: ({ teamId, participantId }) =>
    teamService.inviteMember({ teamId, participantId }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    alert('Приглашение отправлено!')
  },
})

inviteMutation.mutate({ teamId: 1, participantId: 2 })
```

**Сервис**:
```typescript
async inviteMember(data: InviteMemberDto): Promise<void> {
  await apiClient.post(`/teams/${data.teamId}/invite`, {
    participantId: data.participantId
  })
}
```

**Что происходит**:
1. Пользователь нажимает "Пригласить"
2. Вызывается `inviteMutation.mutate()`
3. POST запрос на `/teams/1/invite` с `participantId: 2`
4. Backend создает приглашение
5. Обновляется кеш команд

---

## 🎣 REACT HOOKS - ДЕТАЛЬНОЕ ОБЪЯСНЕНИЕ

### useState

**Что делает**: Хранит локальное состояние компонента.

```typescript
const [value, setValue] = useState(initialValue)
```

**Пример**:
```typescript
const [count, setCount] = useState(0)
const [name, setName] = useState('')
const [items, setItems] = useState<string[]>([])
```

**Обновление состояния**:
```typescript
setCount(5)              // Простое значение
setCount(prev => prev + 1)  // Функция (для массивов/объектов)
setItems([...items, newItem])  // Новый массив
```

**Важно**: Всегда создавайте новые объекты/массивы при обновлении!

### useEffect

**Что делает**: Выполняет побочные эффекты (запросы, подписки).

```typescript
useEffect(() => {
  // Код выполняется после рендера
}, [dependencies])
```

**Примеры**:
```typescript
// Выполнится один раз при монтировании
useEffect(() => {
  console.log('Компонент смонтирован')
}, [])

// Выполнится при изменении userId
useEffect(() => {
  fetchUser(userId)
}, [userId])

// Очистка при размонтировании
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Tick')
  }, 1000)
  
  return () => clearInterval(interval)  // Очистка
}, [])
```

### useContext

**Что делает**: Получает данные из Context.

```typescript
const context = useContext(MyContext)
```

**Пример**:
```typescript
const { user, isAuthenticated, login } = useUser()
```

### useMemo

**Что делает**: Мемоизирует (кеширует) результат вычисления.

```typescript
const memoizedValue = useMemo(() => {
  return expensiveCalculation(a, b)
}, [a, b])
```

**Пример**:
```typescript
const filteredItems = useMemo(() => {
  return items.filter(item => item.category === selectedCategory)
}, [items, selectedCategory])
```

**Зачем**: Избежать повторных тяжелых вычислений при каждом рендере.

### useQuery (React Query)

**Что делает**: Загружает данные с автоматическим кешированием.

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['key'],
  queryFn: () => fetchData(),
})
```

**Пример**:
```typescript
const { data: users, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => userService.getAll(),
})
```

**Возвращает**:
- `data` - загруженные данные
- `isLoading` - идет ли загрузка
- `error` - ошибка, если есть
- `refetch` - функция для перезагрузки

### useMutation (React Query)

**Что делает**: Выполняет операции изменения данных (создание, обновление, удаление).

```typescript
const mutation = useMutation({
  mutationFn: (data) => createItem(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
  },
})

mutation.mutate(newData)
```

**Пример**:
```typescript
const createMutation = useMutation({
  mutationFn: (hackathon) => hackathonService.create(hackathon),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['hackathons'] })
  },
})

createMutation.mutate({ title: '...', description: '...' })
```

**Возвращает**:
- `mutate` - функция для вызова мутации
- `isPending` - идет ли выполнение
- `isSuccess` - успешно ли выполнилось
- `error` - ошибка, если есть

---

## 🔄 ПОТОКИ ДАННЫХ В ПРИЛОЖЕНИИ

### Поток 1: Загрузка списка хакатонов

```
1. Пользователь открывает /hackatons
   ↓
2. Компонент Hackathons монтируется
   ↓
3. useQuery вызывает hackathonService.getAll()
   ↓
4. Сервис делает GET /api/hackathons
   ↓
5. Vite проксирует на backend:8000/hackathons
   ↓
6. Backend возвращает JSON
   ↓
7. Сервис преобразует данные
   ↓
8. useQuery сохраняет в кеш ['hackathons']
   ↓
9. Компонент получает data и отрисовывает список
```

### Поток 2: Авторизация

```
1. Пользователь вводит код и нажимает "Войти"
   ↓
2. handleSubmit отправляет POST /login-by-code
   ↓
3. Backend проверяет код и создает токен
   ↓
4. Токен сохраняется в cookies
   ↓
5. Backend возвращает telegram_id
   ↓
6. Сохраняем telegram_id в localStorage
   ↓
7. Вызываем login(telegram_id) из UserProvider
   ↓
8. UserProvider делает GET /participants/{telegram_id}
   ↓
9. Получаем данные пользователя
   ↓
10. Сохраняем в состояние UserProvider
   ↓
11. Все компоненты получают обновленные данные через useUser()
   ↓
12. Роутер видит isAuthenticated = true
   ↓
13. Показываются защищенные страницы
```

### Поток 3: Фильтрация участников

```
1. Пользователь нажимает на навык "React"
   ↓
2. Вызывается toggleSkill('React')
   ↓
3. setSelectedSkills обновляет состояние
   ↓
4. React перерисовывает компонент
   ↓
5. useMemo для filteredParticipants пересчитывается
   ↓
6. Фильтрует участников по выбранным навыкам
   ↓
7. Компонент отрисовывает отфильтрованный список
```

---

## 🎯 КЛЮЧЕВЫЕ ПРИНЦИПЫ

### 1. Однонаправленный поток данных

Данные всегда текут сверху вниз (от родителя к ребенку):
```
App → UserProvider → Router → Pages → Components
```

### 2. Подъем состояния (Lifting State Up)

Если два компонента используют одни данные - храните в общем родителе или Context.

### 3. Неизменяемость (Immutability)

При обновлении состояния создавайте новые объекты/массивы:
```typescript
// ✅ Правильно
setItems([...items, newItem])
setUser({ ...user, name: 'New Name' })

// ❌ Неправильно
items.push(newItem)  // Мутирует старый массив
user.name = 'New Name'  // Мутирует старый объект
```

### 4. Ключи в map()

При рендеринге списков всегда указывайте `key`:
```typescript
{items.map(item => (
  <ItemComponent key={item.id} {...item} />
))}
```

### 5. Условный рендеринг

```typescript
{isLoading && <div>Загрузка...</div>}
{error && <div>{error}</div>}
{user && <UserProfile user={user} />}
{items.length > 0 ? <List items={items} /> : <EmptyState />}
```

---

## 📚 ЗАКЛЮЧЕНИЕ

Этот проект использует современный стек React с:
- **React Query** для управления серверным состоянием
- **Context API** для глобального состояния
- **React Router** для навигации
- **TypeScript** для типизации
- **Axios** для HTTP запросов

Основные паттерны:
- Компоненты получают данные через `useQuery`
- Изменения данных через `useMutation`
- Глобальное состояние через Context
- Локальное состояние через `useState`
- Оптимизация через `useMemo`

**Следующие шаги для изучения**:
1. Практикуйтесь с каждым хуком отдельно
2. Создайте простой проект для отработки
3. Изучите документацию React и React Query
4. Попробуйте добавить новую функцию в проект

Удачи! 🚀
