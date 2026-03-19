import type { LucideIcon } from 'lucide-react'
import { LogOut, Menu, Settings, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { AuthSession } from '../../App'
import { logoutSession } from '../../auth/appAuth'
import { Button } from '../ui/button'
import { ThemeToggle } from '../ui/theme-toggle'

type SidebarItem = {
  label: string
  to: string
  icon: LucideIcon
}

type DashboardLayoutProps = {
  session: AuthSession
  items: SidebarItem[]
  onLogout: () => void
}

export function DashboardLayout({ session, items, onLogout }: DashboardLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsMobileSidebarOpen(false)
    setIsSettingsOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logoutSession()
    onLogout()
  }

  return (
    <main className="dashboard-shell">
      <div
        className={isMobileSidebarOpen ? 'sidebar-overlay sidebar-overlay-open' : 'sidebar-overlay'}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside className={isMobileSidebarOpen ? 'dashboard-sidebar sidebar-open' : 'dashboard-sidebar'}>
        <div className="sidebar-top">
          <nav className="sidebar-nav">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-icon">
              <UserRound size={16} />
            </div>
            <div>
              <p className="sidebar-title">{session.display_name}</p>
              <p className="sidebar-subtitle">@{session.username}</p>
            </div>
          </div>

          <div className="settings-box">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="settings-trigger"
              onClick={() => setIsSettingsOpen((state) => !state)}
            >
              <Settings size={14} />
              <span>Configuracoes</span>
            </Button>

            {isSettingsOpen && (
              <div className="settings-menu">
                <ThemeToggle />
                <Button type="button" variant="destructive" size="sm" onClick={handleLogout}>
                  <LogOut size={14} />
                  <span>Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-mobile-header">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="menu-trigger"
            onClick={() => setIsMobileSidebarOpen((state) => !state)}
          >
            {isMobileSidebarOpen ? <X size={16} /> : <Menu size={16} />}
            <span>Menu</span>
          </Button>
        </header>
        <Outlet />
      </section>
    </main>
  )
}
