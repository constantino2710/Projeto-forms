import { Eye, EyeOff } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import type { AuthSession } from '../App'
import { login } from '../auth/appAuth'
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
import { formLabelClass } from '../lib/formStyles'

type LoginPageProps = {
  onLogin: (session: AuthSession) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const session = await login(username, password)
      onLogin(session)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao autenticar.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-5 bg-[radial-gradient(circle_at_18%_18%,hsl(var(--accent)/0.5)_0,transparent_38%),radial-gradient(circle_at_85%_82%,hsl(var(--secondary)/0.5)_0,transparent_34%)]">
      <Card>
        <CardHeader>
          <div className="flex justify-end mb-2.5">
            <ThemeToggle />
          </div>
          <CardTitle>Login do Sistema</CardTitle>
          <CardDescription className="m-0 text-muted-foreground">
            Informe seu usuario e senha para entrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <label className={formLabelClass}>
              Usuario
              <Input
                value={username}
                onChange={(event) => {
                  setError('')
                  setUsername(event.target.value)
                }}
                placeholder="RA do professor ou login do admin"
                required
                autoComplete="username"
              />
            </label>

            <label className={formLabelClass}>
              Senha
              <div className="relative block">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  required
                  autoComplete="current-password"
                  className="pr-[2.6rem]"
                />
                <button
                  type="button"
                  className="absolute right-[0.45rem] top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 p-0 border-none bg-transparent text-muted-foreground cursor-pointer rounded-[calc(var(--radius)-4px)] transition-[color,background-color] duration-150 ease-in-out hover:text-foreground hover:bg-accent/60 focus-visible:outline-none focus-visible:text-foreground focus-visible:shadow-[0_0_0_2px_hsl(var(--ring)/0.4)]"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && <p className="m-0 text-destructive font-semibold">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
