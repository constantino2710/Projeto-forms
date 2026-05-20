import { useEffect, useState } from 'react'
import { FilePlus2, FolderKanban, History, LayoutList, UserPlus, Users } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import {
  clearSessionToken,
  getStoredSession,
  getStoredSessionRole,
  getStoredSessionToken,
  persistSession,
  validateSession,
} from './auth/appAuth'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Spinner } from './components/ui/spinner'
import { prefetchAdminProjects, prefetchAdminProjectHistory } from './features/projects/adminProjects'
import { AdminProjectDetailPage } from './pages/admin/AdminProjectDetailPage'
import { AdminProjectHistoryPage } from './pages/admin/AdminProjectHistoryPage'
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage'
import { LoginPage } from './pages/LoginPage'
import { SettingsPage } from './pages/SettingsPage'
import { SuperDisciplinesPage } from './pages/super/SuperDisciplinesPage'
import { SuperHistoryPage } from './pages/super/SuperHistoryPage'
import { SuperNewUserPage } from './pages/super/SuperNewUserPage'
import { SuperUsersPage } from './pages/super/SuperUsersPage'
import { UserProjectDetailPage } from './pages/user/UserProjectDetailPage'
import { UserNewProjectPage } from './pages/user/UserNewProjectPage'
import { UserProjectsPage } from './pages/user/UserProjectsPage'

export type AuthRole = 'admin' | 'user' | 'superadmin'

export type AuthSession = {
  token: string
  user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  role: AuthRole
}

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession())
  const [isValidating, setIsValidating] = useState(() => Boolean(getStoredSessionToken()))

  useEffect(() => {
    if (session) persistSession(session)
  }, [session])

  useEffect(() => {
    const token = getStoredSessionToken()

    if (!token) {
      clearSessionToken()
      setSession(null)
      setIsValidating(false)
      return
    }

    const cachedRole = getStoredSessionRole()
    if (cachedRole === 'admin' || cachedRole === 'superadmin') {
      prefetchAdminProjects()
      prefetchAdminProjectHistory()
    }

    validateSession(token)
      .then((currentSession) => {
        if (currentSession) {
          setSession(currentSession)
        } else {
          clearSessionToken()
          setSession(null)
        }
      })
      .catch(() => {
        clearSessionToken()
        setSession(null)
      })
      .finally(() => setIsValidating(false))
  }, [])

  const handleLogin = (nextSession: AuthSession) => {
    setSession(nextSession)
  }

  const handleLogout = () => {
    clearSessionToken()
    setSession(null)
  }

  if (isValidating && !session) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-5 bg-[radial-gradient(circle_at_18%_18%,hsl(var(--accent)/0.5)_0,transparent_38%),radial-gradient(circle_at_85%_82%,hsl(var(--secondary)/0.5)_0,transparent_34%)] text-muted-foreground">
        <Spinner size="lg" />
      </main>
    )
  }

  const defaultPath =
    session?.role === 'superadmin'
      ? '/super'
      : session?.role === 'admin'
        ? '/admin'
        : '/usuario'

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session ? <Navigate to={defaultPath} replace /> : <LoginPage onLogin={handleLogin} />
        }
      />
      <Route
        path="/usuario"
        element={
          !session
            ? <Navigate to="/login" replace />
            : session.role !== 'user'
              ? <Navigate to={defaultPath} replace />
              : (
                <DashboardLayout
                  session={session}
                  onLogout={handleLogout}
                  onSessionUpdate={setSession}
                  items={[
                    { label: 'Meus Projetos', to: '/usuario/meus-projetos', icon: FolderKanban },
                    { label: 'Novo Projeto', to: '/usuario/novo-projeto', icon: FilePlus2 },
                  ]}
                />
              )
        }
      >
        <Route index element={<Navigate to="meus-projetos" replace />} />
        <Route path="meus-projetos" element={<UserProjectsPage />} />
        <Route path="meus-projetos/:projectId" element={<UserProjectDetailPage />} />
        <Route path="novo-projeto" element={<UserNewProjectPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
      <Route
        path="/admin"
        element={
          !session
            ? <Navigate to="/login" replace />
            : session.role !== 'admin' && session.role !== 'superadmin'
              ? <Navigate to={defaultPath} replace />
              : (
                <DashboardLayout
                  session={session}
                  onLogout={handleLogout}
                  onSessionUpdate={setSession}
                  items={
                    session.role === 'superadmin'
                      ? [
                          { label: 'Projetos', to: '/admin/projetos', icon: LayoutList },
                          { label: 'Historico Geral', to: '/super/historico', icon: History },
                          { label: 'Usuarios', to: '/super/usuarios', icon: Users },
                          { label: 'Novo Usuario', to: '/super/usuarios/novo', icon: UserPlus },
                        ]
                      : [
                          { label: 'Projetos', to: '/admin/projetos', icon: LayoutList },
                          { label: 'Historico', to: '/admin/historico', icon: History },
                        ]
                  }
                />
              )
        }
      >
        <Route index element={<Navigate to="projetos" replace />} />
        <Route path="projetos" element={<AdminProjectsPage />} />
        <Route path="projetos/:projectId" element={<AdminProjectDetailPage />} />
        <Route path="historico" element={<AdminProjectHistoryPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
      <Route
        path="/super"
        element={
          !session
            ? <Navigate to="/login" replace />
            : session.role !== 'superadmin'
              ? <Navigate to={defaultPath} replace />
              : (
                <DashboardLayout
                  session={session}
                  onLogout={handleLogout}
                  onSessionUpdate={setSession}
                  items={[
                    { label: 'Projetos', to: '/admin/projetos', icon: LayoutList },
                    { label: 'Historico Geral', to: '/super/historico', icon: History },
                    { label: 'Usuarios', to: '/super/usuarios', icon: Users },
                    { label: 'Novo Usuario', to: '/super/usuarios/novo', icon: UserPlus },
                  ]}
                />
              )
        }
      >
        <Route index element={<Navigate to="usuarios" replace />} />
        <Route path="usuarios" element={<SuperUsersPage />} />
        <Route path="usuarios/novo" element={<SuperNewUserPage />} />
        <Route path="disciplinas" element={<SuperDisciplinesPage />} />
        <Route path="historico" element={<SuperHistoryPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={session ? defaultPath : '/login'} replace />} />
    </Routes>
  )
}

export default App
