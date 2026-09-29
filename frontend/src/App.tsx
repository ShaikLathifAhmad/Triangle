import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './screens/Dashboard'
import DealsList from './screens/DealsList'
import DealWorkspace from './screens/DealWorkspace'
import Contacts from './screens/Contacts'
import Briefing from './screens/Briefing'
import Memory from './screens/Memory'
import Login from './screens/Login'
import ChatBot from './screens/ChatBot'
import { isAuthenticated, getUser, clearAuth, type AuthUser } from './utils/auth'

export type Screen = 'dashboard' | 'deals' | 'deal' | 'contacts' | 'briefing' | 'memory' | 'chat'

export default function App() {
  const [authed, setAuthed] = useState<boolean>(isAuthenticated)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getUser)
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [selectedDealId, setSelectedDealId] = useState<number | null>(null)

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user)
    setAuthed(true)
  }

  const handleLogout = () => {
    clearAuth()
    setAuthed(false)
    setCurrentUser(null)
    setScreen('dashboard')
    setSelectedDealId(null)
  }

  const handleNavigate = (newScreen: Screen, dealId?: number) => {
    setScreen(newScreen)
    if (dealId !== undefined) setSelectedDealId(dealId)
  }

  if (!authed) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar
        activeScreen={screen}
        onNavigate={handleNavigate}
        user={currentUser}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {screen === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
        {screen === 'deals'     && <DealsList onNavigate={handleNavigate} />}
        {screen === 'deal'      && <DealWorkspace onNavigate={handleNavigate} dealId={selectedDealId} />}
        {screen === 'contacts'  && <Contacts onNavigate={handleNavigate} />}
        {screen === 'briefing'  && <Briefing onNavigate={handleNavigate} dealId={selectedDealId} />}
        {screen === 'memory'    && <Memory onNavigate={handleNavigate} dealId={selectedDealId} />}
        {screen === 'chat'      && <ChatBot onNavigate={handleNavigate} />}
      </main>
    </div>
  )
}
