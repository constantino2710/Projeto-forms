import { Eye, EyeOff, KeyRound, Pencil, ShieldCheck, Trash2, UserCog } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  listSuperUsers,
  deleteSuperUser,
  resetSuperUserPassword,
  updateSuperUser,
  type SuperUserRole,
  type SuperUserRow,
} from '../../features/super/superAdmin'
import { checkboxItemClass, formLabelClass } from '../../lib/formStyles'
import {
  dashboardNoteClass,
  dashboardPanelClass,
  errorTextClass,
  projectCardClass,
  projectCardMetaClass,
  projectCardTopClass,
  projectTitleWrapClass,
  projectTypeBadgeBaseClass,
  projectTypeBadgeDisciplinaClass,
  projectTypeBadgeExtensaoClass,
  projectsHeaderClass,
  projectsListClass,
  statusBadgeBaseClass,
  statusColorMap,
  viewToggleClass,
  activeToggleButtonClass,
} from '../../lib/projectStyles'
import { cn } from '../../lib/utils'

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

type DeleteState = {
  user: SuperUserRow
}

const settingsMenuClass =
  'mt-6 p-4 flex flex-col gap-2 border border-border rounded-[calc(var(--radius)-2px)] bg-card'

const passwordToggleClass =
  'absolute right-[0.45rem] top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 p-0 border-none bg-transparent text-muted-foreground cursor-pointer rounded-[calc(var(--radius)-4px)] transition-[color,background-color] duration-150 ease-in-out hover:text-foreground hover:bg-accent/60 focus-visible:outline-none focus-visible:text-foreground focus-visible:shadow-[0_0_0_2px_hsl(var(--ring)/0.4)]'

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
  const [removing, setRemoving] = useState<DeleteState | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

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

  const handleDeleteUser = async () => {
    if (!removing) return
    setActionError('')
    setActionMessage('')
    setIsSaving(true)
    try {
      await deleteSuperUser({ id: removing.user.id })
      setActionMessage('Usuario removido.')
      setRemoving(null)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao remover usuario.'
      setActionError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <article className={dashboardPanelClass}>
      <div className={projectsHeaderClass}>
        <div>
          <h1>Usuarios da Plataforma</h1>
          <p>Liste, edite, redefina senha e remova professores e administradores.</p>
        </div>
        <Link to="/super/usuarios/novo">
          <Button type="button" size="sm">
            <UserCog size={14} />
            <span>Novo Usuario</span>
          </Button>
        </Link>
      </div>

      <div className={cn(viewToggleClass, 'mb-3')}>
        {(['all', 'user', 'admin', 'superadmin'] as RoleFilter[]).map((role) => (
          <Button
            key={role}
            type="button"
            variant="outline"
            size="sm"
            className={roleFilter === role ? activeToggleButtonClass : ''}
            onClick={() => handleRoleFilter(role)}
          >
            <span>{role === 'all' ? 'Todos' : roleLabel[role]}</span>
          </Button>
        ))}
      </div>

      <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3.5 mb-4">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por nome, RA ou e-mail"
        />
        <Button type="submit" variant="outline" size="sm">
          Buscar
        </Button>
      </form>

      {actionMessage && <p className={dashboardNoteClass}>{actionMessage}</p>}
      {actionError && <p className={errorTextClass}>{actionError}</p>}
      {error && <p className={errorTextClass}>{error}</p>}
      {isLoading && <p className={dashboardNoteClass}>Carregando usuarios...</p>}
      {!isLoading && rows.length === 0 && (
        <p className={dashboardNoteClass}>Nenhum usuario encontrado.</p>
      )}

      <div className={projectsListClass}>
        {rows.map((user) => (
          <section key={user.id} className={projectCardClass}>
            <div className={projectCardTopClass}>
              <div className={projectTitleWrapClass}>
                <h2>{user.display_name}</h2>
                <span
                  className={cn(
                    projectTypeBadgeBaseClass,
                    user.role === 'superadmin'
                      ? projectTypeBadgeExtensaoClass
                      : user.role === 'admin'
                        ? projectTypeBadgeDisciplinaClass
                        : '',
                  )}
                >
                  {roleLabel[user.role]}
                </span>
              </div>
              <span
                className={cn(
                  statusBadgeBaseClass,
                  user.is_active ? statusColorMap.aprovado : statusColorMap.reprovado,
                )}
              >
                {user.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className={projectCardMetaClass}>@{user.username}</p>
            <p className={projectCardMetaClass}>{user.email ?? 'sem e-mail'}</p>

            <div className={cn(viewToggleClass, 'mt-2')}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionError('')
                  setActionMessage('')
                  setResetting(null)
                  setRemoving(null)
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
                    setEditing(null)
                    setRemoving(null)
                    setShowResetPassword(false)
                    setShowResetConfirm(false)
                    setResetting({ user, password: '', confirm: '' })
                  }}
                >
                  <KeyRound size={14} />
                  <span>Redefinir senha</span>
                </Button>
              )}
              {user.role !== 'superadmin' && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setActionError('')
                    setActionMessage('')
                    setEditing(null)
                    setResetting(null)
                    setRemoving({ user })
                  }}
                >
                  <Trash2 size={14} />
                  <span>Remover</span>
                </Button>
              )}
            </div>
          </section>
        ))}
      </div>

      {total > PAGE_SIZE && (
        <div className={cn(viewToggleClass, 'mt-4')}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </Button>
          <span className={cn(dashboardNoteClass, 'self-center mx-3 my-0')}>
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
        <div className={settingsMenuClass}>
          <h2 className="flex items-center gap-2">
            <ShieldCheck size={16} /> Editar {editing.user.display_name}
          </h2>
          <label className={formLabelClass}>
            Nome
            <Input
              value={editing.display_name}
              onChange={(event) => setEditing({ ...editing, display_name: event.target.value })}
            />
          </label>
          <label className={formLabelClass}>
            E-mail
            <Input
              value={editing.email}
              onChange={(event) => setEditing({ ...editing, email: event.target.value })}
              placeholder="opcional"
            />
          </label>
          <label className={checkboxItemClass}>
            <input
              type="checkbox"
              className="m-0 w-4 h-4 self-start justify-self-start mt-0.5"
              checked={editing.is_active}
              onChange={(event) => setEditing({ ...editing, is_active: event.target.checked })}
            />
            <span className="block leading-[1.45]">Ativo</span>
          </label>
          <div className={viewToggleClass}>
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
        <div className={settingsMenuClass}>
          <h2 className="flex items-center gap-2">
            <KeyRound size={16} /> Redefinir senha de {resetting.user.display_name}
          </h2>
          <label className={formLabelClass}>
            Nova senha
            <div className="relative block">
              <Input
                type={showResetPassword ? 'text' : 'password'}
                value={resetting.password}
                onChange={(event) => setResetting({ ...resetting, password: event.target.value })}
                placeholder="minimo 6 caracteres"
                className="pr-[2.6rem]"
              />
              <button
                type="button"
                className={passwordToggleClass}
                onClick={() => setShowResetPassword((value) => !value)}
                aria-label={showResetPassword ? 'Ocultar senha' : 'Mostrar senha'}
                title={showResetPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <label className={formLabelClass}>
            Confirmar senha
            <div className="relative block">
              <Input
                type={showResetConfirm ? 'text' : 'password'}
                value={resetting.confirm}
                onChange={(event) => setResetting({ ...resetting, confirm: event.target.value })}
                className="pr-[2.6rem]"
              />
              <button
                type="button"
                className={passwordToggleClass}
                onClick={() => setShowResetConfirm((value) => !value)}
                aria-label={showResetConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                title={showResetConfirm ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showResetConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <div className={viewToggleClass}>
            <Button type="button" variant="outline" size="sm" onClick={() => setResetting(null)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={handleResetPassword} disabled={isSaving}>
              {isSaving ? 'Aplicando...' : 'Aplicar'}
            </Button>
          </div>
        </div>
      )}

      {removing && (
        <div className={settingsMenuClass}>
          <h2 className="flex items-center gap-2">
            <Trash2 size={16} /> Remover {removing.user.display_name}
          </h2>
          <p className={dashboardNoteClass}>
            Esta acao remove o usuario da plataforma e encerra as sessoes ativas dele.
          </p>
          <p className={dashboardNoteClass}>
            Se esse usuario tiver projetos vinculados, a remocao sera bloqueada para preservar os dados.
          </p>
          <div className={viewToggleClass}>
            <Button type="button" variant="outline" size="sm" onClick={() => setRemoving(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={handleDeleteUser} disabled={isSaving}>
              {isSaving ? 'Removendo...' : 'Confirmar remocao'}
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}
