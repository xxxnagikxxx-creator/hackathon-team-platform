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

export default App
