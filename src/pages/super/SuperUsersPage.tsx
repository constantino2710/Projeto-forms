import { KeyRound, Pencil, ShieldCheck, UserCog } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  listSuperUsers,
  resetSuperUserPassword,
  updateSuperUser,
  type SuperUserRole,
  type SuperUserRow,
} from '../../features/super/superAdmin'

const PAGE_SIZE = 10

type RoleFilter = 'all' | SuperUserRole

const roleLabel: Record<SuperUserRole, string> = {
  user: 'Professor',
  admin: 'Admin',
  superadmin: 'Superadmin',
}

type EditState = {
  user: SuperUserRow
  display_name: string
  email: string
  is_active: boolean
}

type ResetState = {
  user: SuperUserRow
  password: string
  confirm: string
}

export function SuperUsersPage() {
  const [rows, setRows] = useState<SuperUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<EditState | null>(null)
  const [resetting, setResetting] = useState<ResetState | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const load = async () => {
    setError('')
    setIsLoading(true)
    try {
      const { rows: data, total: totalCount } = await listSuperUsers({
        role: roleFilter === 'all' ? null : roleFilter,
        search: search || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      setRows(data)
      setTotal(totalCount)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar usuarios.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter, search])

  const handleRoleFilter = (role: RoleFilter) => {
    setPage(0)
    setRoleFilter(role)
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(0)
    setSearch(searchInput.trim())
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    setActionError('')
    setActionMessage('')
    setIsSaving(true)
    try {
      await updateSuperUser({
        id: editing.user.id,
        display_name: editing.display_name,
        email: editing.email.trim() || null,
        is_active: editing.is_active,
      })
      setActionMessage('Usuario atualizado.')
      setEditing(null)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar.'
      setActionError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetPassword = async () => {
    if (!resetting) return
    setActionError('')
    setActionMessage('')
    if (resetting.password !== resetting.confirm) {
      setActionError('As senhas nao conferem.')
      return
    }
    setIsSaving(true)
    try {
      await resetSuperUserPassword({ id: resetting.user.id, password: resetting.password })
      setActionMessage('Senha redefinida.')
      setResetting(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao redefinir senha.'
      setActionError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <article className="dashboard-panel">
      <div className="projects-header">
        <div>
          <h1>Usuarios da Plataforma</h1>
          <p>Liste, edite e gerencie professores e administradores.</p>
        </div>
        <Link to="/super/usuarios/novo">
          <Button type="button" size="sm">
            <UserCog size={14} />
            <span>Novo Usuario</span>
          </Button>
        </Link>
      </div>

      <div className="view-toggle" style={{ marginBottom: 12 }}>
        {(['all', 'user', 'admin', 'superadmin'] as RoleFilter[]).map((role) => (
          <Button
            key={role}
            type="button"
            variant="outline"
            size="sm"
            className={roleFilter === role ? 'active' : ''}
            onClick={() => handleRoleFilter(role)}
          >
            <span>{role === 'all' ? 'Todos' : roleLabel[role]}</span>
          </Button>
        ))}
      </div>

      <form onSubmit={handleSearchSubmit} className="form" style={{ marginBottom: 16 }}>
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por nome, RA ou e-mail"
        />
        <Button type="submit" variant="outline" size="sm">
          Buscar
        </Button>
      </form>

      {actionMessage && <p className="dashboard-note">{actionMessage}</p>}
      {actionError && <p className="error">{actionError}</p>}
      {error && <p className="error">{error}</p>}
      {isLoading && <p className="dashboard-note">Carregando usuarios...</p>}
      {!isLoading && rows.length === 0 && (
        <p className="dashboard-note">Nenhum usuario encontrado.</p>
      )}

      <div className="projects-list">
        {rows.map((user) => (
          <section key={user.id} className="project-card">
            <div className="project-card-top">
              <div className="project-title-wrap">
                <h2>{user.display_name}</h2>
                <span
                  className={`project-type-badge ${
                    user.role === 'superadmin'
                      ? 'project-type-badge--extensao'
                      : user.role === 'admin'
                        ? 'project-type-badge--disciplina'
                        : ''
                  }`}
                >
                  {roleLabel[user.role]}
                </span>
              </div>
              <span className={`status-badge ${user.is_active ? 'status-aprovado' : 'status-reprovado'}`}>
                {user.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="project-card-meta">@{user.username}</p>
            <p className="project-card-meta">{user.email ?? 'sem e-mail'}</p>

            <div className="view-toggle" style={{ marginTop: 8 }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionError('')
                  setActionMessage('')
                  setEditing({
                    user,
                    display_name: user.display_name,
                    email: user.email ?? '',
                    is_active: user.is_active,
                  })
                }}
                disabled={user.role === 'superadmin'}
                title={user.role === 'superadmin' ? 'Use outro fluxo para superadmin' : 'Editar usuario'}
              >
                <Pencil size={14} />
                <span>Editar</span>
              </Button>
              {user.role !== 'superadmin' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActionError('')
                    setActionMessage('')
                    setResetting({ user, password: '', confirm: '' })
                  }}
                >
                  <KeyRound size={14} />
                  <span>Redefinir senha</span>
                </Button>
              )}
            </div>
          </section>
        ))}
      </div>

      {total > PAGE_SIZE && (
        <div className="view-toggle" style={{ marginTop: 16 }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </Button>
          <span className="dashboard-note" style={{ alignSelf: 'center', margin: '0 12px' }}>
            Pagina {page + 1} de {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Proxima
          </Button>
        </div>
      )}

      {editing && (
        <div className="settings-menu" style={{ marginTop: 24, padding: 16 }}>
          <h2>
            <ShieldCheck size={16} /> Editar {editing.user.display_name}
          </h2>
          <label>
            Nome
            <Input
              value={editing.display_name}
              onChange={(event) => setEditing({ ...editing, display_name: event.target.value })}
            />
          </label>
          <label>
            E-mail
            <Input
              value={editing.email}
              onChange={(event) => setEditing({ ...editing, email: event.target.value })}
              placeholder="opcional"
            />
          </label>
          <label className="settings-avatar-field">
            <span>Ativo</span>
            <input
              type="checkbox"
              checked={editing.is_active}
              onChange={(event) => setEditing({ ...editing, is_active: event.target.checked })}
            />
          </label>
          <div className="view-toggle">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      )}

      {resetting && (
        <div className="settings-menu" style={{ marginTop: 24, padding: 16 }}>
          <h2>
            <KeyRound size={16} /> Redefinir senha de {resetting.user.display_name}
          </h2>
          <label>
            Nova senha
            <Input
              type="password"
              value={resetting.password}
              onChange={(event) => setResetting({ ...resetting, password: event.target.value })}
              placeholder="minimo 6 caracteres"
            />
          </label>
          <label>
            Confirmar senha
            <Input
              type="password"
              value={resetting.confirm}
              onChange={(event) => setResetting({ ...resetting, confirm: event.target.value })}
            />
          </label>
          <div className="view-toggle">
            <Button type="button" variant="outline" size="sm" onClick={() => setResetting(null)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleResetPassword} disabled={isSaving}>
              {isSaving ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}
