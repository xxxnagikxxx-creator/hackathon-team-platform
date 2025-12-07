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
import { useUser } from '../providers/UserProvider'

function AppRouter() {
  const { isAuthenticated } = useUser()

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

