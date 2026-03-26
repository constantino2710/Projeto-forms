import { useEffect, useState } from 'react'
import { FilePlus2, FolderKanban, History, LayoutList } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { clearSessionToken, getStoredSessionToken, validateSession } from './auth/appAuth'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { AdminProjectDetailPage } from './pages/admin/AdminProjectDetailPage'
import { AdminProjectHistoryPage } from './pages/admin/AdminProjectHistoryPage'
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage'
import { LoginPage } from './pages/LoginPage'
import { UserProjectDetailPage } from './pages/user/UserProjectDetailPage'
import { UserNewProjectPage } from './pages/user/UserNewProjectPage'
import { UserProjectsPage } from './pages/user/UserProjectsPage'

export type AuthRole = 'admin' | 'user'

export type AuthSession = {
  token: string
  user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  role: AuthRole
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<AuthSession | null>(null)

  useEffect(() => {
    const loadSession = async () => {
      const token = getStoredSessionToken()

      if (!token) {
        clearSessionToken()
        setSession(null)
        setIsLoading(false)
        return
      }

      try {
        const currentSession = await validateSession(token)
        setSession(currentSession)
      } catch {
        clearSessionToken()
        setSession(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadSession()
  }, [])

  const handleLogin = (nextSession: AuthSession) => {
    setSession(nextSession)
  }

  const handleLogout = () => {
    clearSessionToken()
    setSession(null)
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_18%_18%,hsl(var(--accent)/0.5)_0,transparent_38%),radial-gradient(circle_at_85%_82%,hsl(var(--secondary)/0.5)_0,transparent_34%)] px-4 py-5">
        <Card>
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="m-0 text-[hsl(var(--muted-foreground))]">Validando sessao.</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const defaultPath = session?.role === 'admin' ? '/admin' : '/usuario'

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
              ? <Navigate to="/admin" replace />
              : (
                <DashboardLayout
                  session={session}
                  onLogout={handleLogout}
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
      </Route>
      <Route
        path="/admin"
        element={
          !session
            ? <Navigate to="/login" replace />
            : session.role !== 'admin'
              ? <Navigate to="/usuario" replace />
              : (
                <DashboardLayout
                  session={session}
                  onLogout={handleLogout}
                  items={[
                    { label: 'Projetos', to: '/admin/projetos', icon: LayoutList },
                    { label: 'Historico', to: '/admin/historico', icon: History },
                  ]}
                />
              )
        }
      >
        <Route index element={<Navigate to="projetos" replace />} />
        <Route path="projetos" element={<AdminProjectsPage />} />
        <Route path="projetos/:projectId" element={<AdminProjectDetailPage />} />
        <Route path="historico" element={<AdminProjectHistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to={session ? defaultPath : '/login'} replace />} />
    </Routes>
  )
}

export default App
