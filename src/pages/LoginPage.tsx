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

type LoginPageProps = {
  onLogin: (session: AuthSession) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
    <main className="auth-shell">
      <Card>
        <CardHeader>
          <div className="top-actions">
            <ThemeToggle />
          </div>
          <CardTitle>Login do Sistema</CardTitle>
          <CardDescription className="hint">
            Informe seu usuario e senha para entrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="form">
            <label>
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

            <label>
              Senha
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                required
                autoComplete="current-password"
              />
            </label>

            {error && <p className="error">{error}</p>}

            <Button type="submit" className="full-width" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
