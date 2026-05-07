import type { LucideIcon } from 'lucide-react'
import { ChevronRight, LogOut, Menu, Settings, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { AuthSession } from '../../App'
import { logoutSession, updateMyAvatar } from '../../auth/appAuth'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
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
  const SIDEBAR_COLLAPSED_KEY = 'dashboard_sidebar_collapsed'
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(session.avatar_url ?? null)
  const [avatarDraft, setAvatarDraft] = useState(session.avatar_url ?? '')
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  })
  const location = useLocation()

  useEffect(() => {
    setIsMobileSidebarOpen(false)
    setIsSettingsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    setAvatarUrl(session.avatar_url ?? null)
    setAvatarDraft(session.avatar_url ?? '')
  }, [session.avatar_url])

  const handleLogout = async () => {
    await logoutSession()
    onLogout()
  }

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed((current) => {
      const next = !current
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      if (next) {
        setIsSettingsOpen(false)
      }
      return next
    })
  }

  const handleSaveAvatar = async () => {
    setAvatarError('')
    setIsSavingAvatar(true)
    try {
      const nextAvatar = await updateMyAvatar(avatarDraft)
      setAvatarUrl(nextAvatar)
      setAvatarDraft(nextAvatar ?? '')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar foto.'
      setAvatarError(message)
    } finally {
      setIsSavingAvatar(false)
    }
  }

  return (
    <main className={isDesktopSidebarCollapsed ? 'dashboard-shell sidebar-collapsed' : 'dashboard-shell'}>
      <div
        className={isMobileSidebarOpen ? 'sidebar-overlay sidebar-overlay-open' : 'sidebar-overlay'}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside
        className={
          isMobileSidebarOpen
            ? `dashboard-sidebar sidebar-open ${isDesktopSidebarCollapsed ? 'dashboard-sidebar-collapsed' : ''}`
            : `dashboard-sidebar ${isDesktopSidebarCollapsed ? 'dashboard-sidebar-collapsed' : ''}`
        }
      >
        <div className="sidebar-top">
          <div className="sidebar-collapse-row">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={isDesktopSidebarCollapsed ? 'sidebar-collapse-btn' : 'sidebar-collapse-btn is-expanded'}
              onClick={toggleDesktopSidebar}
              title={isDesktopSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            >
              <ChevronRight size={16} />
            </Button>
          </div>

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
                  title={item.label}
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
              {avatarUrl ? (
                <img src={avatarUrl} alt={`Foto de ${session.display_name}`} className="sidebar-user-photo" />
              ) : (
                <UserRound size={16} />
              )}
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
              title="Configuracoes"
            >
              <Settings size={14} />
              <span>Configuracoes</span>
            </Button>

            {isSettingsOpen && (
              <div className="settings-menu">
                <label className="settings-avatar-field">
                  <span>URL da foto</span>
                  <Input
                    value={avatarDraft}
                    onChange={(event) => setAvatarDraft(event.target.value)}
                    placeholder="https://..."
                    disabled={isSavingAvatar}
                  />
                </label>
                {avatarError && <p className="settings-error">{avatarError}</p>}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAvatar}
                  disabled={isSavingAvatar}
                >
                  <span>{isSavingAvatar ? 'Salvando...' : 'Salvar foto'}</span>
                </Button>
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
