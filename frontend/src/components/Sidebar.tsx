import { LayoutDashboard, ArrowUpDown, Users, Sparkles, FileText, Brain, ChevronRight, LogOut } from 'lucide-react'
import type { Screen } from '../App'
import type { AuthUser } from '../utils/auth'

interface Props {
  activeScreen: Screen
  onNavigate: (screen: Screen, dealId?: number) => void
  user: AuthUser | null
  onLogout: () => void
}

function NavItem({
  icon: Icon, label, active, onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
        active ? 'bg-orange-50 text-orange-500' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
      }`}>
      <Icon size={15} className={active ? 'text-orange-500' : 'text-gray-400'} />
      {label}
    </button>
  )
}

export default function Sidebar({ activeScreen, onNavigate, user, onLogout }: Props) {
  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : 'U'

  return (
    <div className="w-[220px] min-w-[220px] bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-2.5">
        <img src="/favicon.svg" alt="Triangle" className="w-8 h-8 flex-shrink-0" />
        <span className="font-bold text-gray-900 text-base tracking-tight">Triangle</span>
      </div>

      {/* Main Menu */}
      <div className="px-3 pt-2">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1.5">Main Menu</p>
        <NavItem icon={LayoutDashboard} label="Dashboard" active={activeScreen === 'dashboard'} onClick={() => onNavigate('dashboard')} />
        <NavItem icon={ArrowUpDown} label="Deals" active={activeScreen === 'deals' || activeScreen === 'deal'} onClick={() => onNavigate('deals')} />
        <NavItem icon={Users} label="Contacts" active={activeScreen === 'contacts'} onClick={() => onNavigate('contacts')} />
      </div>

      {/* AI Assistant */}
      <div className="px-3 pt-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1.5">AI Assistant</p>
        <NavItem icon={Sparkles} label="Deal Intelligence" active={activeScreen === 'chat'} onClick={() => onNavigate('chat')} />
        <NavItem icon={FileText} label="Meeting Briefs" active={activeScreen === 'briefing'} onClick={() => onNavigate('briefing')} />
        <NavItem icon={Brain} label="Memory & Learning" active={activeScreen === 'memory'} onClick={() => onNavigate('memory')} />
      </div>

      {/* Bottom — user info + logout */}
      <div className="mt-auto p-3 space-y-2">
        {/* User card */}
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.role || ''}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  )
}
