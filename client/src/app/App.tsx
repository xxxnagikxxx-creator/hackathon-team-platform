import './mainStyles/main.scss'
import './mainStyles/reset.css'
import { UserProvider } from './providers/UserProvider'
import AppRouter from './router/router'

function App() {
  return (
    <UserProvider>
      <AppRouter />
    </UserProvider>
  )
}

export default App
