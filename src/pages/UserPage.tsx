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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_18%_18%,hsl(var(--accent)/0.5)_0,transparent_38%),radial-gradient(circle_at_85%_82%,hsl(var(--secondary)/0.5)_0,transparent_34%)] px-4 py-5">
      <Card>
        <CardHeader>
          <div className="mb-2.5 flex justify-end">
            <ThemeToggle />
          </div>
          <CardTitle>Painel do Usuario</CardTitle>
          <CardDescription>Area exclusiva do professor.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            <li className="rounded-[calc(var(--radius)-4px)] border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)] px-3 py-2.5">Bem-vindo, {session.display_name}.</li>
            <li className="rounded-[calc(var(--radius)-4px)] border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)] px-3 py-2.5">Usuario: {session.username}</li>
            <li className="rounded-[calc(var(--radius)-4px)] border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)] px-3 py-2.5">Perfil: {session.role}</li>
          </ul>
          <div className="mt-3.5">
            <Button type="button" className="w-full" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
