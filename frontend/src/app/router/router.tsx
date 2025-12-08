import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from '../../widgets/Header'
import { Home } from '../../pages/Home'
import { Hackatons } from '../../pages/Hackathons/Hackathons'
import { HackathonDetail } from '../../pages/HackathonDetail'
import { Notifications } from '../../pages/Notifications/Notifications'
import { Profile } from '../../pages/Profile/Profile'
import { Teams } from '../../pages/Teams/Teams'
import { TeamDetail } from '../../pages/TeamDetail'
import { Participants } from '../../pages/Participants/Participants'
import { ParticipantDetail } from '../../pages/ParticipantDetail'
import { Sidebar } from '../../widgets/Sidebar'
import { NotFoundPage } from '../../pages/NotFoundPage/NotFoundPage'
import { AdminPanel } from '../../pages/AdminPanel'
import { useUser } from '../providers/UserProvider'
import { useState } from 'react'

function AppRouter() {
  const { isAuthenticated, isLoading } = useUser()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Показываем загрузку пока проверяется аутентификация
  if (isLoading) {
    return (
      <BrowserRouter>
        <div className="app">
          <Header />
          <main className="app__content">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100vh',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #C8F133',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p>Загрузка...</p>
            </div>
          </main>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </BrowserRouter>
    )
  }

  const toggleMenu = () => {
    console.log('toggleMenu called, current state:', isMenuOpen)
    setIsMenuOpen(prev => {
      const newState = !prev
      console.log('Setting menu state to:', newState)
      return newState
    })
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Header 
          onMenuToggle={toggleMenu} 
          isMenuOpen={isMenuOpen}
        />
        {isAuthenticated && (
          <div className="app__layout">
            <Sidebar 
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
            />
            <main className="app__content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/hackatons" element={<Hackatons />} />
                <Route path="/hackatons/admin" element={<AdminPanel />} />
                <Route path="/hackatons/:id" element={<HackathonDetail />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/participants" element={<Participants />} />
                <Route path="/participants/:id" element={<ParticipantDetail />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/teams/:id" element={<TeamDetail />} />
                <Route path="/*" element={<NotFoundPage />} />
              </Routes>
            </main>
          </div>
        )}
        {!isAuthenticated && (
          <main className="app__content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/hackatons/admin" element={<AdminPanel />} />
              <Route path="/*" element={<Home />} />
            </Routes>
          </main>
        )}
      </div>
    </BrowserRouter>
  )
}

export default AppRouter


















// import { BrowserRouter, Routes, Route } from 'react-router-dom'
// import { Header } from '../../widgets/Header'
// import Hackathons from '../../pages/Hackathons/Hackathons'
// import Notifications from '../../pages/Notifications/Notifications'
// import Participants from '../../pages/Participants/Participants'
// import Profile from '../../pages/Profile/Profile'
// import Teams from '../../pages/Teams/Teams'

// export const AppRouter = () => {
//   return (
//     <BrowserRouter>
//       <div className="app">
//         <Header />
//         <main className="app__content">
//           <Routes>
//             <Route path="/" element={<Hackathons />} />
//             <Route path="/notifications" element={<Notifications />} />
//             <Route path="/participants" element={<Participants />} />
//             <Route path="/profile" element={<Profile />} />
//             <Route path="/teams" element={<Teams />} />
//           </Routes>
//         </main>
//       </div>
//     </BrowserRouter>
//   )
// }

