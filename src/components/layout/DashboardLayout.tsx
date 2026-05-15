import type { LucideIcon } from 'lucide-react'
import { ChevronRight, LogOut, Menu, Settings, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { AuthSession } from '../../App'
import { logoutSession } from '../../auth/appAuth'
import { Button } from '../ui/button'
import { ThemeToggle } from '../ui/theme-toggle'
import { cn } from '../../lib/utils'

type SidebarItem = {
  label: string
  to: string
  icon: LucideIcon
}

type DashboardLayoutProps = {
  session: AuthSession
  items: SidebarItem[]
  onLogout: () => void
  onSessionUpdate: (next: AuthSession) => void
}

const settingsPathForRole = (role: AuthSession['role']) => {
  if (role === 'superadmin') return '/super/configuracoes'
  if (role === 'admin') return '/admin/configuracoes'
  return '/usuario/configuracoes'
}

export function DashboardLayout({
  session,
  items,
  onLogout,
  onSessionUpdate,
}: DashboardLayoutProps) {
  const SIDEBAR_COLLAPSED_KEY = 'dashboard_sidebar_collapsed'
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  })
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = async () => {
    await logoutSession()
    onLogout()
  }

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed((current) => {
      const next = !current
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      return next
    })
  }

  const settingsPath = settingsPathForRole(session.role)
  const avatarUrl = session.avatar_url ?? null

  return (
    <main className="block relative min-h-screen h-screen overflow-hidden bg-background max-md:h-auto max-md:overflow-visible">
      <div
        className={cn(
          'fixed inset-0 hidden max-md:block bg-[hsl(222_30%_8%/0.45)] backdrop-blur-[4px] z-20 transition-opacity duration-200 ease-in-out',
          isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-30 flex flex-col justify-between gap-4 overflow-y-auto',
          'border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-text))]',
          'transition-[width,padding,transform] duration-[260ms] ease-in-out',
          isDesktopSidebarCollapsed ? 'w-[84px] px-2.5 py-6' : 'w-[280px] px-4 py-6',
          'max-md:w-[min(78vw,300px)] max-md:px-4 max-md:py-6 max-md:border-r max-md:border-border max-md:shadow-[0_18px_48px_hsl(var(--foreground)/0.24)] max-md:transition-transform max-md:duration-200',
          isMobileSidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
        )}
      >
        <div className="flex flex-col gap-3">
          <div
            className={cn(
              'flex max-md:hidden',
              isDesktopSidebarCollapsed ? 'justify-center' : 'justify-end',
            )}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'w-8 min-w-8 min-h-8 p-0',
                'border-[hsl(var(--sidebar-link-border))] bg-[hsl(var(--sidebar-link-bg))] text-[hsl(var(--sidebar-text))]',
                'hover:not-disabled:bg-[hsl(var(--sidebar-link-hover-bg))] hover:not-disabled:text-[hsl(var(--sidebar-text))]',
                '[&_svg]:transition-transform [&_svg]:duration-[240ms] [&_svg]:ease-in-out',
                !isDesktopSidebarCollapsed && '[&_svg]:rotate-180',
              )}
              onClick={toggleDesktopSidebar}
              title={isDesktopSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 no-underline border rounded-[calc(var(--radius)-2px)] px-2.5 py-2 font-medium text-[0.83rem]',
                      'transition-[background-color,border-color,color] duration-150 ease-in-out',
                      isActive
                        ? 'bg-[hsl(var(--sidebar-link-active-bg))] border-[hsl(var(--sidebar-link-active-bg))] text-[hsl(var(--sidebar-link-active-text))]'
                        : 'bg-[hsl(var(--sidebar-link-bg))] border-[hsl(var(--sidebar-link-border))] text-[hsl(var(--sidebar-text))] hover:bg-[hsl(var(--sidebar-link-hover-bg))] hover:text-[hsl(var(--sidebar-text))]',
                      isDesktopSidebarCollapsed && 'max-md:justify-start max-md:p-2.5 md:justify-center md:p-2 md:[&>span]:hidden',
                    )
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

        <div className="flex flex-col gap-2.5 border-t border-[hsl(var(--sidebar-link-border))] pt-3">
          <div
            className={cn(
              'flex items-center gap-2.5',
              isDesktopSidebarCollapsed && 'md:justify-center md:[&>div:last-child]:hidden',
            )}
          >
            <div className="w-7 h-7 rounded-full border border-[hsl(var(--sidebar-link-border))] grid place-items-center text-[hsl(var(--sidebar-muted))] bg-[hsl(var(--sidebar-surface-bg))] overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Foto de ${session.display_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserRound size={16} />
              )}
            </div>
            <div>
              <p className="m-0 text-[0.92rem] leading-tight text-[hsl(var(--sidebar-text))]">
                {session.display_name}
              </p>
              <p className="m-0 text-[hsl(var(--sidebar-muted))] text-[0.78rem]">
                @{session.username}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              'w-full',
              'border-[hsl(var(--sidebar-link-border))] bg-[hsl(var(--sidebar-link-bg))] text-[hsl(var(--sidebar-text))]',
              'hover:not-disabled:bg-[hsl(var(--sidebar-link-hover-bg))] hover:not-disabled:text-[hsl(var(--sidebar-text))]',
              isDesktopSidebarCollapsed && 'md:justify-center md:[&>span]:hidden',
            )}
            onClick={() => navigate(settingsPath)}
            title="Configuracoes"
          >
            <Settings size={14} />
            <span>Configuracoes</span>
          </Button>

          <ThemeToggle />

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className={cn(isDesktopSidebarCollapsed && 'md:justify-center md:[&>span]:hidden')}
            title="Logout"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      <section
        className={cn(
          'h-screen overflow-y-auto p-6',
          'transition-[margin-left,width,max-width] duration-[260ms] ease-in-out',
          isDesktopSidebarCollapsed
            ? 'ml-[84px] w-[calc(100%-84px)] max-w-[calc(100%-84px)]'
            : 'ml-[280px] w-[calc(100%-280px)] max-w-[calc(100%-280px)]',
          'max-md:ml-0 max-md:w-full max-md:max-w-full max-md:h-auto max-md:overflow-visible max-md:p-4',
        )}
      >
        <header className="hidden max-md:flex mb-3.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-auto"
            onClick={() => setIsMobileSidebarOpen((state) => !state)}
          >
            {isMobileSidebarOpen ? <X size={16} /> : <Menu size={16} />}
            <span>Menu</span>
          </Button>
        </header>
        <Outlet context={{ session, onSessionUpdate }} />
      </section>
    </main>
  )
}
