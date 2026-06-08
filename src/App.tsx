import { Suspense, lazy, useEffect, useState } from 'react'
import { DatabaseBackup, FilePlus2, FolderKanban, History, LayoutList, UserPlus, Users } from 'lucide-react'
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
import { LoginPage } from './pages/LoginPage'

const AdminProjectDetailPage = lazy(() =>
  import('./pages/admin/AdminProjectDetailPage').then((m) => ({ default: m.AdminProjectDetailPage })),
)
const AdminProjectHistoryPage = lazy(() =>
  import('./pages/admin/AdminProjectHistoryPage').then((m) => ({ default: m.AdminProjectHistoryPage })),
)
const AdminProjectsPage = lazy(() =>
  import('./pages/admin/AdminProjectsPage').then((m) => ({ default: m.AdminProjectsPage })),
)
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)
const SuperBackupsPage = lazy(() =>
  import('./pages/super/SuperBackupsPage').then((m) => ({ default: m.SuperBackupsPage })),
)
const SuperDisciplinesPage = lazy(() =>
  import('./pages/super/SuperDisciplinesPage').then((m) => ({ default: m.SuperDisciplinesPage })),
)
const SuperHistoryPage = lazy(() =>
  import('./pages/super/SuperHistoryPage').then((m) => ({ default: m.SuperHistoryPage })),
)
const SuperNewUserPage = lazy(() =>
  import('./pages/super/SuperNewUserPage').then((m) => ({ default: m.SuperNewUserPage })),
)
const SuperUsersPage = lazy(() =>
  import('./pages/super/SuperUsersPage').then((m) => ({ default: m.SuperUsersPage })),
)
const UserProjectDetailPage = lazy(() =>
  import('./pages/user/UserProjectDetailPage').then((m) => ({ default: m.UserProjectDetailPage })),
)
const UserNewProjectPage = lazy(() =>
  import('./pages/user/UserNewProjectPage').then((m) => ({ default: m.UserNewProjectPage })),
)
const UserProjectsPage = lazy(() =>
  import('./pages/user/UserProjectsPage').then((m) => ({ default: m.UserProjectsPage })),
)

const routeFallback = (
  <main className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
    <Spinner size="lg" />
  </main>
)

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
    <Suspense fallback={routeFallback}>
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
                          { label: 'Histórico Geral', to: '/super/historico', icon: History },
                          { label: 'Usuários', to: '/super/usuarios', icon: Users },
                          { label: 'Novo Usuário', to: '/super/usuarios/novo', icon: UserPlus },
                          { label: 'Backups', to: '/super/backups', icon: DatabaseBackup },
                        ]
                      : [
                          { label: 'Projetos', to: '/admin/projetos', icon: LayoutList },
                          { label: 'Histórico', to: '/admin/historico', icon: History },
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
                    { label: 'Histórico Geral', to: '/super/historico', icon: History },
                    { label: 'Usuários', to: '/super/usuarios', icon: Users },
                    { label: 'Novo Usuário', to: '/super/usuarios/novo', icon: UserPlus },
                    { label: 'Backups', to: '/super/backups', icon: DatabaseBackup },
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
        <Route path="backups" element={<SuperBackupsPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={session ? defaultPath : '/login'} replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
