import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { clearSessionToken, getStoredSessionToken, validateSession } from './auth/appAuth'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { AdminPage } from './pages/AdminPage'
import { LoginPage } from './pages/LoginPage'
import { UserPage } from './pages/UserPage'

export type AuthRole = 'admin' | 'user'

export type AuthSession = {
  token: string
  user_id: string
  username: string
  display_name: string
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
      <main className="auth-shell">
        <Card>
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="hint">Validando sessao.</p>
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
              : <UserPage session={session} onLogout={handleLogout} />
        }
      />
      <Route
        path="/admin"
        element={
          !session
            ? <Navigate to="/login" replace />
            : session.role !== 'admin'
              ? <Navigate to="/usuario" replace />
              : <AdminPage session={session} onLogout={handleLogout} />
        }
      />
      <Route path="*" element={<Navigate to={session ? defaultPath : '/login'} replace />} />
    </Routes>
  )
}

export default App
