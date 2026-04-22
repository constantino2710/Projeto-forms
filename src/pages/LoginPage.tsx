import { type FormEvent, useState } from 'react'
import type { AuthSession } from '../App'
import { loginAdmin, loginUser } from '../auth/appAuth'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { ThemeToggle } from '../components/ui/theme-toggle'

type LoginMode = 'user' | 'admin'

type LoginPageProps = {
  onLogin: (session: AuthSession) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<LoginMode>('user')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const session =
        mode === 'user'
          ? await loginUser(username)
          : await loginAdmin(username, password)

      onLogin(session)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao autenticar.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUsernameChange = (value: string) => {
    setError('')
    setUsername(mode === 'user' ? value.replace(/\D/g, '') : value)
  }

  const handleModeChange = (nextMode: LoginMode) => {
    setMode(nextMode)
    setError('')
    setPassword('')
    setUsername(nextMode === 'user' ? username.replace(/\D/g, '') : username)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_18%_18%,hsl(var(--accent)/0.5)_0,transparent_38%),radial-gradient(circle_at_85%_82%,hsl(var(--secondary)/0.5)_0,transparent_34%)] px-4 py-5">
      <Card>
        <CardHeader>
          <div className="mb-2.5 flex justify-end">
            <ThemeToggle />
          </div>
          <CardTitle>Login do Sistema</CardTitle>
          <CardDescription className="m-0 text-[hsl(var(--muted-foreground))]">
            Acesso restrito para usuarios e administradores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="my-[14px] grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={
                mode === 'user'
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : ''
              }
              onClick={() => handleModeChange('user')}
            >
              Usuario
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={
                mode === 'admin'
                  ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : ''
              }
              onClick={() => handleModeChange('admin')}
            >
              Admin
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
            <label className="flex flex-col gap-1.5 text-[0.925rem] font-semibold">
              Nome de usuario
              <Input
                value={username}
                onChange={(event) => handleUsernameChange(event.target.value)}
                placeholder={mode === 'user' ? 'Ex: 00000123456' : 'Ex: admin'}
                required
                inputMode={mode === 'user' ? 'numeric' : undefined}
                maxLength={mode === 'user' ? 11 : undefined}
              />
            </label>

            {mode === 'user' && (
              <p className="hint">
                Informe o RA com 11 digitos. Somente numeros sao aceitos.
              </p>
            )}

            {mode === 'admin' && (
              <label className="flex flex-col gap-1.5 text-[0.925rem] font-semibold">
                Senha
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  required
                />
              </label>
            )}

            {error && (
              <p className="m-0 font-semibold text-[hsl(var(--destructive))]">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
