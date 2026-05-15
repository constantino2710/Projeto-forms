import { type FormEvent, useEffect, useState } from 'react'
import { FileSpreadsheet, UserRound } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../App'
import { updateMyProfile } from '../auth/appAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { formLabelClass } from '../lib/formStyles'
import {
  dashboardNoteClass,
  dashboardPanelClass,
  errorTextClass,
  projectsHeaderClass,
  successTextClass,
  viewToggleClass,
} from '../lib/projectStyles'
import { cn } from '../lib/utils'

export type DashboardOutletContext = {
  session: AuthSession
  onSessionUpdate: (next: AuthSession) => void
}

const sectionClass =
  'mt-4 p-4 flex flex-col gap-3 border border-border rounded-[calc(var(--radius)-2px)] bg-card'

const avatarPreviewWrapClass =
  'flex items-center gap-3'

const avatarPreviewClass =
  'w-14 h-14 rounded-full border border-border grid place-items-center text-muted-foreground bg-background overflow-hidden'

export function SettingsPage() {
  const navigate = useNavigate()
  const { session, onSessionUpdate } = useOutletContext<DashboardOutletContext>()

  const [displayName, setDisplayName] = useState(session.display_name)
  const [avatarUrl, setAvatarUrl] = useState(session.avatar_url ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setDisplayName(session.display_name)
    setAvatarUrl(session.avatar_url ?? '')
  }, [session.display_name, session.avatar_url])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    const trimmedName = displayName.trim()
    if (!trimmedName) {
      setError('Informe um nome de exibicao.')
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateMyProfile(trimmedName, avatarUrl)
      onSessionUpdate({
        ...session,
        display_name: updated.display_name,
        avatar_url: updated.avatar_url,
      })
      setSuccess('Perfil atualizado com sucesso.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar perfil.')
    } finally {
      setIsSaving(false)
    }
  }

  const previewSrc = avatarUrl.trim() || session.avatar_url || ''

  return (
    <article className={dashboardPanelClass}>
      <div className={projectsHeaderClass}>
        <div>
          <h1>Configuracoes</h1>
          <p>Atualize seus dados de perfil exibidos no sistema.</p>
        </div>
      </div>

      <section className={sectionClass}>
        <h2 className="m-0 text-base">Perfil</h2>

        <div className={avatarPreviewWrapClass}>
          <div className={avatarPreviewClass}>
            {previewSrc ? (
              <img
                src={previewSrc}
                alt={`Foto de ${session.display_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserRound size={22} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">{session.display_name}</span>
            <span className={dashboardNoteClass}>@{session.username}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className={formLabelClass}>
            Nome de exibicao
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Como seu nome aparece no sistema"
              maxLength={120}
              disabled={isSaving}
              required
            />
          </label>

          <label className={formLabelClass}>
            URL da foto de perfil
            <Input
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://..."
              disabled={isSaving}
            />
          </label>
          <p className={dashboardNoteClass}>
            Deixe em branco para remover a foto.
          </p>

          {error && <p className={errorTextClass}>{error}</p>}
          {success && <p className={successTextClass}>{success}</p>}

          <div className={cn(viewToggleClass)}>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar alteracoes'}
            </Button>
          </div>
        </form>
      </section>

      {session.role === 'superadmin' && (
        <section className={sectionClass}>
          <h2 className="m-0 text-base flex items-center gap-2">
            <FileSpreadsheet size={16} /> Catalogo de disciplinas
          </h2>
          <p className={dashboardNoteClass}>
            Importe ou substitua a planilha utilizada nos formularios de extensao.
          </p>
          <div className={cn(viewToggleClass)}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/super/disciplinas')}
            >
              <FileSpreadsheet size={14} />
              <span>Abrir importacao de planilha</span>
            </Button>
          </div>
        </section>
      )}
    </article>
  )
}
