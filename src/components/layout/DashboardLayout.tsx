import type { LucideIcon } from 'lucide-react'
import { ChevronRight, LogOut, Menu, Settings, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { AuthSession } from '../../App'
import { logoutSession, updateMyAvatar } from '../../auth/appAuth'
import { cn } from '../../lib/utils'
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
    <main className="relative block h-screen min-h-screen overflow-hidden bg-[hsl(var(--background))] max-[900px]:h-auto max-[900px]:overflow-visible">
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-20 hidden bg-[hsl(222_30%_8%/0.45)] opacity-0 backdrop-blur-[4px] transition-opacity max-[900px]:block',
          isMobileSidebarOpen && 'pointer-events-auto opacity-100',
        )}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside
        className={
          cn(
            'fixed top-0 bottom-0 left-0 z-30 flex w-[280px] flex-col justify-between gap-4 overflow-y-auto border-r border-r-[hsl(217.2_32.6%_17.5%)] bg-[hsl(222.2_84%_4.9%)] px-4 py-6 text-[hsl(210_40%_98%)] transition-[width,padding,transform] duration-200 max-[900px]:inset-y-0 max-[900px]:w-[min(78vw,300px)] max-[900px]:-translate-x-full max-[900px]:border-r-[hsl(var(--border))] max-[900px]:shadow-[0_18px_48px_hsl(var(--foreground)/0.24)] dark:border-r-[hsl(var(--border))] dark:bg-[hsl(var(--card))] dark:text-[hsl(var(--foreground))]',
            isDesktopSidebarCollapsed && '!w-[84px] !px-[10px]',
            isMobileSidebarOpen && 'max-[900px]:translate-x-0',
          )
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-end max-[900px]:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-8 w-8 min-h-8 min-w-8 p-0 border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(217.2_32.6%_22%)] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--background))] dark:text-[hsl(var(--foreground))] dark:hover:bg-[hsl(var(--accent))]',
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
                      'flex items-center gap-2 rounded-[calc(var(--radius)-2px)] border border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] px-2.5 py-2 text-[0.83rem] font-medium text-[hsl(210_40%_98%)] no-underline transition-colors hover:bg-[hsl(217.2_32.6%_22%)] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--background))] dark:text-[hsl(var(--foreground))] dark:hover:bg-[hsl(var(--accent))]',
                      isActive &&
                        'border-[hsl(210_40%_98%)] bg-[hsl(210_40%_98%)] text-[hsl(222.2_47.4%_11.2%)] dark:border-[hsl(var(--primary))] dark:bg-[hsl(var(--primary))] dark:text-[hsl(var(--primary-foreground))]',
                      isDesktopSidebarCollapsed && 'justify-center px-2',
                    )
                  }
                  title={item.label}
                >
                  <Icon size={16} />
                  {!isDesktopSidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-t-[hsl(217.2_32.6%_17.5%)] pt-3 dark:border-t-[hsl(var(--border))]">
          <div className={cn('flex items-center gap-2.5', isDesktopSidebarCollapsed && 'justify-center')}>
            <div className="grid h-7 w-7 place-items-center overflow-hidden rounded-full border border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(215_20.2%_65.1%)] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))] dark:text-[hsl(var(--muted-foreground))]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`Foto de ${session.display_name}`} className="h-full w-full object-cover" />
              ) : (
                <UserRound size={16} />
              )}
            </div>
            {!isDesktopSidebarCollapsed && (
              <div>
                <p className="m-0 text-[0.92rem] leading-[1.2] text-[hsl(210_40%_98%)] dark:text-[hsl(var(--foreground))]">{session.display_name}</p>
                <p className="m-0 text-[0.78rem] text-[hsl(215_20.2%_65.1%)] dark:text-[hsl(var(--muted-foreground))]">@{session.username}</p>
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(217.2_32.6%_22%)] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--background))] dark:text-[hsl(var(--foreground))] dark:hover:bg-[hsl(var(--accent))]"
              onClick={() => setIsSettingsOpen((state) => !state)}
              title="Configuracoes"
            >
              <Settings size={14} />
              {!isDesktopSidebarCollapsed && <span>Configuracoes</span>}
            </Button>

            {isSettingsOpen && (
              <div className="mt-2 flex flex-col gap-2 rounded-[calc(var(--radius)-2px)] border border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] p-2 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))]">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[0.72rem] font-bold text-[hsl(215_20.2%_65.1%)] dark:text-[hsl(var(--muted-foreground))]">URL da foto</span>
                  <Input
                    value={avatarDraft}
                    onChange={(event) => setAvatarDraft(event.target.value)}
                    placeholder="https://..."
                    disabled={isSavingAvatar}
                  />
                </label>
                {avatarError && <p className="m-0 text-[0.78rem] font-semibold text-[hsl(var(--destructive))]">{avatarError}</p>}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(217.2_32.6%_22%)] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--background))] dark:text-[hsl(var(--foreground))] dark:hover:bg-[hsl(var(--accent))]"
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

      <section
        className={cn(
          'ml-[280px] h-screen w-[calc(100%_-_280px)] max-w-[calc(100%_-_280px)] overflow-y-auto p-6 transition-[margin-left,width,max-width] duration-200 max-[900px]:m-0 max-[900px]:h-auto max-[900px]:w-full max-[900px]:max-w-full max-[900px]:overflow-visible max-[900px]:p-4',
          isDesktopSidebarCollapsed && '!ml-[84px] !w-[calc(100%_-_84px)] !max-w-[calc(100%_-_84px)] max-[900px]:!m-0 max-[900px]:!w-full max-[900px]:!max-w-full',
        )}
      >
        <header className="mb-3.5 hidden max-[900px]:flex">
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
        <Outlet />
      </section>
    </main>
  )
}
