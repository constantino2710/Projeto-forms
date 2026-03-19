import type { AuthSession } from '../App'
import { logoutSession } from '../auth/appAuth'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { ThemeToggle } from '../components/ui/theme-toggle'

type UserPageProps = {
  session: AuthSession
  onLogout: () => void
}

export function UserPage({ session, onLogout }: UserPageProps) {
  const handleLogout = async () => {
    await logoutSession()
    onLogout()
  }

  return (
    <main className="auth-shell">
      <Card>
        <CardHeader>
          <div className="top-actions">
            <ThemeToggle />
          </div>
          <CardTitle>Painel do Usuario</CardTitle>
          <CardDescription>Area exclusiva do professor.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="page-lines">
            <li>Bem-vindo, {session.display_name}.</li>
            <li>Usuario: {session.username}</li>
            <li>Perfil: {session.role}</li>
          </ul>
          <div className="page-actions">
            <Button type="button" className="full-width" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
