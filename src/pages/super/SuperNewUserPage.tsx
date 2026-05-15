import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import { createSuperUser } from '../../features/super/superAdmin'
import { formLabelClass } from '../../lib/formStyles'
import {
  dashboardPanelClass,
  errorTextClass,
  projectsHeaderClass,
  viewToggleClass,
} from '../../lib/projectStyles'
import { cn } from '../../lib/utils'

type Role = 'user' | 'admin'

const DEFAULT_PASSWORD = 'acesso123'

const segmentedClass =
  'mb-4 grid grid-cols-2 gap-2'

const activeSegmentClass = 'border-primary! bg-primary! text-primary-foreground!'

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
    <article className={dashboardPanelClass}>
      <div className={projectsHeaderClass}>
        <div>
          <h1>Novo Usuario</h1>
          <p>
            Cadastre um professor (RA) ou um administrador. Senha padrao{' '}
            <strong>{DEFAULT_PASSWORD}</strong> - voce pode alterar antes de salvar.
          </p>
        </div>
      </div>

      <div className={segmentedClass}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={role === 'user' ? activeSegmentClass : ''}
          onClick={() => handleRoleChange('user')}
        >
          Professor
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={role === 'admin' ? activeSegmentClass : ''}
          onClick={() => handleRoleChange('admin')}
        >
          Admin
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <label className={formLabelClass}>
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

        <label className={formLabelClass}>
          Nome de exibicao
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Nome completo"
            required
          />
        </label>

        <label className={formLabelClass}>
          E-mail (opcional)
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@exemplo.com"
          />
        </label>

        <label className={formLabelClass}>
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
        <label className={formLabelClass}>
          Confirmar senha
          <Input
            type="text"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={6}
          />
        </label>

        {error && <p className={errorTextClass}>{error}</p>}

        <div className={cn(viewToggleClass)}>
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
            {isSubmitting && <Spinner size="sm" />}
            <span>Criar usuario</span>
          </Button>
        </div>
      </form>
    </article>
  )
}
