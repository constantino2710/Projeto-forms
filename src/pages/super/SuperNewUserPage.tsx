import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { createSuperUser } from '../../features/super/superAdmin'

type Role = 'user' | 'admin'

const DEFAULT_PASSWORD = 'acesso123'

export function SuperNewUserPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('user')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState(DEFAULT_PASSWORD)
  const [confirmPassword, setConfirmPassword] = useState(DEFAULT_PASSWORD)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('As senhas nao conferem.')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      await createSuperUser({
        username: username.trim(),
        display_name: displayName.trim(),
        email: email.trim() || null,
        role,
        password,
      })
      navigate('/super/usuarios')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao criar usuario.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUsernameChange = (value: string) => {
    if (role === 'user') {
      setUsername(value.replace(/\D/g, '').slice(0, 11))
    } else {
      setUsername(value)
    }
  }

  const handleRoleChange = (next: Role) => {
    setRole(next)
    setUsername('')
    setError('')
  }

  return (
    <article className="dashboard-panel">
      <div className="projects-header">
        <div>
          <h1>Novo Usuario</h1>
          <p>
            Cadastre um professor (RA) ou um administrador. Senha padrao{' '}
            <strong>{DEFAULT_PASSWORD}</strong> - voce pode alterar antes de salvar.
          </p>
        </div>
      </div>

      <div className="segmented" style={{ marginBottom: 16 }}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={role === 'user' ? 'active' : ''}
          onClick={() => handleRoleChange('user')}
        >
          Professor
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={role === 'admin' ? 'active' : ''}
          onClick={() => handleRoleChange('admin')}
        >
          Admin
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Nome de usuario
          <Input
            value={username}
            onChange={(event) => handleUsernameChange(event.target.value)}
            placeholder={role === 'user' ? 'RA com 11 digitos' : 'login do admin'}
            required
            inputMode={role === 'user' ? 'numeric' : undefined}
            maxLength={role === 'user' ? 11 : 20}
          />
        </label>

        <label>
          Nome de exibicao
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Nome completo"
            required
          />
        </label>

        <label>
          E-mail (opcional)
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@exemplo.com"
          />
        </label>

        <label>
          Senha inicial
          <Input
            type="text"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="minimo 6 caracteres"
            required
            minLength={6}
          />
        </label>
        <label>
          Confirmar senha
          <Input
            type="text"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={6}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="view-toggle">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/super/usuarios')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Criar usuario'}
          </Button>
        </div>
      </form>
    </article>
  )
}
