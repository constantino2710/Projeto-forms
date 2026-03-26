import type { LucideIcon } from 'lucide-react'
import { ChevronRight, LogOut, Mail, Menu, Pencil, Settings, UserRound, X } from 'lucide-react'
import { type ChangeEvent, type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import type { AuthSession } from '../../App'
import { getStoredSessionToken, logoutSession, updateMyProfile, validateSession } from '../../auth/appAuth'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ThemeToggle } from '../ui/theme-toggle'

type SidebarItem = {
  label: string
  to: string
  icon: LucideIcon
}

type DashboardLayoutProps = {
  session: AuthSession
  items: SidebarItem[]
  onLogout: () => void
  onSessionUpdate: (updates: Partial<AuthSession>) => void
}

export function DashboardLayout({ session, items, onLogout, onSessionUpdate }: DashboardLayoutProps) {
  const AVATAR_EDITOR_SIZE = 240
  const AVATAR_CANVAS_SIZE = 512
  const SIDEBAR_COLLAPSED_KEY = 'dashboard_sidebar_collapsed'
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(session.avatar_url ?? null)
  const [profileName, setProfileName] = useState(session.display_name)
  const [profileEmail, setProfileEmail] = useState(session.email ?? '')
  const [profileAvatarDraft, setProfileAvatarDraft] = useState(session.avatar_url ?? '')
  const [avatarEditorSource, setAvatarEditorSource] = useState<string | null>(null)
  const [avatarEditorFile, setAvatarEditorFile] = useState<File | null>(null)
  const [avatarSourceWidth, setAvatarSourceWidth] = useState(0)
  const [avatarSourceHeight, setAvatarSourceHeight] = useState(0)
  const [avatarZoom, setAvatarZoom] = useState(1)
  const [avatarOffsetX, setAvatarOffsetX] = useState(0)
  const [avatarOffsetY, setAvatarOffsetY] = useState(0)
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dragStateRef = useRef<{ startX: number; startY: number; baseOffsetX: number; baseOffsetY: number } | null>(null)
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  })
  const location = useLocation()
  const hasRegisteredEmail = profileEmail.trim().length > 0

  useEffect(() => {
    setIsMobileSidebarOpen(false)
    setIsSettingsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    setAvatarUrl(session.avatar_url ?? null)
    setProfileName(session.display_name)
    setProfileEmail(session.email ?? '')
    setProfileAvatarDraft(session.avatar_url ?? '')
    setAvatarEditorSource(null)
    setAvatarEditorFile(null)
    setAvatarSourceWidth(0)
    setAvatarSourceHeight(0)
    setAvatarZoom(1)
    setAvatarOffsetX(0)
    setAvatarOffsetY(0)
  }, [session.avatar_url, session.display_name, session.email])

  const handleLogout = async () => {
    await logoutSession()
    onLogout()
  }

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed((current) => {
      const next = !current
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0')
      return next
    })
  }

  const handleOpenProfileModal = async () => {
    setProfileError('')
    setProfileName(session.display_name)
    setProfileEmail(session.email ?? '')
    setProfileAvatarDraft(session.avatar_url ?? '')
    setAvatarEditorSource(null)
    setAvatarEditorFile(null)
    setAvatarSourceWidth(0)
    setAvatarSourceHeight(0)
    setAvatarZoom(1)
    setAvatarOffsetX(0)
    setAvatarOffsetY(0)
    setIsSettingsOpen(false)
    setIsProfileModalOpen(true)

    const token = getStoredSessionToken()
    if (!token) {
      return
    }

    setIsLoadingProfile(true)
    try {
      const refreshedSession = await validateSession(token)
      if (!refreshedSession) {
        return
      }

      onSessionUpdate({
        display_name: refreshedSession.display_name,
        email: refreshedSession.email,
        avatar_url: refreshedSession.avatar_url,
      })
      setAvatarUrl(refreshedSession.avatar_url ?? null)
      setProfileName(refreshedSession.display_name)
      setProfileEmail(refreshedSession.email ?? '')
      setProfileAvatarDraft(refreshedSession.avatar_url ?? '')
      setAvatarEditorSource(null)
      setAvatarEditorFile(null)
      setAvatarSourceWidth(0)
      setAvatarSourceHeight(0)
      setAvatarZoom(1)
      setAvatarOffsetX(0)
      setAvatarOffsetY(0)
    } catch {
      // Mantem os dados locais caso a atualizacao da sessao falhe.
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleSaveProfile = async () => {
    setProfileError('')
    setIsSavingProfile(true)
    try {
      let avatarToSave = profileAvatarDraft

      if (avatarEditorSource && avatarSourceWidth > 0 && avatarSourceHeight > 0) {
        const canvas = document.createElement('canvas')
        canvas.width = AVATAR_CANVAS_SIZE
        canvas.height = AVATAR_CANVAS_SIZE
        const context = canvas.getContext('2d')

        if (!context) {
          throw new Error('Nao foi possivel preparar a imagem de perfil.')
        }

        let drawImageSource: CanvasImageSource
        let sourceWidth = avatarSourceWidth
        let sourceHeight = avatarSourceHeight

        if (avatarEditorFile && 'createImageBitmap' in window) {
          try {
            const bitmap = await createImageBitmap(avatarEditorFile, {
              imageOrientation: 'from-image',
            })
            drawImageSource = bitmap
            sourceWidth = bitmap.width
            sourceHeight = bitmap.height
          } catch {
            const bitmap = await createImageBitmap(avatarEditorFile)
            drawImageSource = bitmap
            sourceWidth = bitmap.width
            sourceHeight = bitmap.height
          }
        } else {
          const image = new Image()
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject(new Error('Falha ao processar a imagem selecionada.'))
            image.src = avatarEditorSource
          })
          drawImageSource = image
          sourceWidth = image.naturalWidth || image.width
          sourceHeight = image.naturalHeight || image.height
        }

        const baseScale = Math.max(AVATAR_CANVAS_SIZE / sourceWidth, AVATAR_CANVAS_SIZE / sourceHeight)
        const scale = baseScale * avatarZoom
        const drawWidth = sourceWidth * scale
        const drawHeight = sourceHeight * scale
        const ratio = AVATAR_CANVAS_SIZE / AVATAR_EDITOR_SIZE
        const maxCanvasOffsetX = Math.max(0, (drawWidth - AVATAR_CANVAS_SIZE) / 2)
        const maxCanvasOffsetY = Math.max(0, (drawHeight - AVATAR_CANVAS_SIZE) / 2)
        const safeOffsetX = clampValue(avatarOffsetX * ratio, -maxCanvasOffsetX, maxCanvasOffsetX)
        const safeOffsetY = clampValue(avatarOffsetY * ratio, -maxCanvasOffsetY, maxCanvasOffsetY)
        const drawX = AVATAR_CANVAS_SIZE / 2 - drawWidth / 2 + safeOffsetX
        const drawY = AVATAR_CANVAS_SIZE / 2 - drawHeight / 2 + safeOffsetY

        context.clearRect(0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE)
        context.drawImage(drawImageSource, drawX, drawY, drawWidth, drawHeight)
        avatarToSave = canvas.toDataURL('image/jpeg', 0.92)
      }

      const updatedProfile = await updateMyProfile({
        displayName: profileName,
        email: profileEmail,
        avatarUrl: avatarToSave,
      })
      setAvatarUrl(updatedProfile.avatar_url)
      onSessionUpdate({
        display_name: updatedProfile.display_name,
        email: updatedProfile.email,
        avatar_url: updatedProfile.avatar_url,
      })
      setIsProfileModalOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao salvar perfil.'
      setProfileError(message)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const clampValue = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value))
  }

  const hasEditorImage = Boolean(avatarEditorSource && avatarSourceWidth > 0 && avatarSourceHeight > 0)
  const editorBaseScale = hasEditorImage
    ? Math.max(AVATAR_EDITOR_SIZE / avatarSourceWidth, AVATAR_EDITOR_SIZE / avatarSourceHeight)
    : 1
  const editorBaseWidth = hasEditorImage ? avatarSourceWidth * editorBaseScale : AVATAR_EDITOR_SIZE
  const editorBaseHeight = hasEditorImage ? avatarSourceHeight * editorBaseScale : AVATAR_EDITOR_SIZE
  const editorDrawWidth = editorBaseWidth * avatarZoom
  const editorDrawHeight = editorBaseHeight * avatarZoom
  const maxOffsetX = hasEditorImage ? Math.max(0, (editorDrawWidth - AVATAR_EDITOR_SIZE) / 2) : 0
  const maxOffsetY = hasEditorImage ? Math.max(0, (editorDrawHeight - AVATAR_EDITOR_SIZE) / 2) : 0

  useEffect(() => {
    if (!hasEditorImage) {
      return
    }
    setAvatarOffsetX((current) => clampValue(current, -maxOffsetX, maxOffsetX))
    setAvatarOffsetY((current) => clampValue(current, -maxOffsetY, maxOffsetY))
  }, [hasEditorImage, maxOffsetX, maxOffsetY])

  const handleAvatarDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasEditorImage || isSavingProfile || isLoadingProfile) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseOffsetX: avatarOffsetX,
      baseOffsetY: avatarOffsetY,
    }
    setIsDraggingAvatar(true)
  }

  const handleAvatarDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current || !hasEditorImage) {
      return
    }

    const deltaX = event.clientX - dragStateRef.current.startX
    const deltaY = event.clientY - dragStateRef.current.startY
    setAvatarOffsetX(clampValue(dragStateRef.current.baseOffsetX + deltaX, -maxOffsetX, maxOffsetX))
    setAvatarOffsetY(clampValue(dragStateRef.current.baseOffsetY + deltaY, -maxOffsetY, maxOffsetY))
  }

  const handleAvatarDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragStateRef.current = null
    setIsDraggingAvatar(false)
  }

  const handlePickAvatar = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setProfileError('Selecione apenas arquivos de imagem.')
      event.target.value = ''
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      setProfileError('A imagem deve ter no maximo 4MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      if (!result) {
        setProfileError('Nao foi possivel ler a imagem selecionada.')
        return
      }

      const image = new Image()
      image.onload = () => {
        setAvatarEditorSource(result)
        setAvatarEditorFile(file)
        setAvatarSourceWidth(image.naturalWidth || image.width)
        setAvatarSourceHeight(image.naturalHeight || image.height)
        setAvatarZoom(1)
        setAvatarOffsetX(0)
        setAvatarOffsetY(0)
        setProfileError('')
      }
      image.onerror = () => {
        setProfileError('Nao foi possivel processar a imagem selecionada.')
      }
      image.src = result
    }
    reader.onerror = () => {
      setProfileError('Nao foi possivel ler a imagem selecionada.')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const avatarPreviewImage = avatarEditorSource || profileAvatarDraft.trim() || avatarUrl || ''
  const avatarDisplayImage = profileAvatarDraft.trim() || avatarUrl || ''
  return (
    <main className="relative block h-screen min-h-screen overflow-hidden bg-[hsl(var(--background))] max-[900px]:h-auto max-[900px]:overflow-visible">
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-20 hidden bg-[hsl(222_30%_8%/0.45)] opacity-0 backdrop-blur-[4px] transition-opacity max-[900px]:block',
          isMobileSidebarOpen && 'pointer-events-auto opacity-100',
        )}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside
        className={
          cn(
            'fixed top-0 bottom-0 left-0 z-30 flex w-[280px] flex-col justify-between gap-4 overflow-y-auto border-r border-r-[hsl(217.2_32.6%_17.5%)] bg-[hsl(222.2_84%_4.9%)] px-4 py-6 text-[hsl(210_40%_98%)] transition-[width,padding,transform] duration-200 max-[900px]:inset-y-0 max-[900px]:w-[min(78vw,300px)] max-[900px]:-translate-x-full max-[900px]:border-r-[hsl(var(--border))] max-[900px]:shadow-[0_18px_48px_hsl(var(--foreground)/0.24)] dark:border-r-[hsl(var(--border))] dark:bg-[hsl(var(--card))] dark:text-[hsl(var(--foreground))]',
            isDesktopSidebarCollapsed && '!w-[84px] !px-[10px]',
            isMobileSidebarOpen && 'max-[900px]:translate-x-0',
          )
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-end max-[900px]:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                'h-8 w-8 min-h-8 min-w-8 p-0 border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(217.2_32.6%_22%)] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--background))] dark:text-[hsl(var(--foreground))] dark:hover:bg-[hsl(var(--accent))]',
                !isDesktopSidebarCollapsed && '[&_svg]:rotate-180',
              )}
              onClick={toggleDesktopSidebar}
              title={isDesktopSidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-[calc(var(--radius)-2px)] border border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] px-2.5 py-2 text-[0.83rem] font-medium text-[hsl(210_40%_98%)] no-underline transition-colors hover:bg-[hsl(217.2_32.6%_22%)] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--background))] dark:text-[hsl(var(--foreground))] dark:hover:bg-[hsl(var(--accent))]',
                      isActive &&
                        'border-[hsl(210_40%_98%)] bg-[hsl(210_40%_98%)] text-[hsl(222.2_47.4%_11.2%)] dark:border-[hsl(var(--primary))] dark:bg-[hsl(var(--primary))] dark:text-[hsl(var(--primary-foreground))]',
                      isDesktopSidebarCollapsed && 'justify-center px-2',
                    )
                  }
                  title={item.label}
                >
                  <Icon size={16} />
                  {!isDesktopSidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2.5 border-t border-t-[hsl(217.2_32.6%_17.5%)] pt-3 dark:border-t-[hsl(var(--border))]">
          <div className={cn('flex items-center gap-2.5', isDesktopSidebarCollapsed && 'justify-center')}>
            <div className="grid h-7 w-7 place-items-center overflow-hidden rounded-full border border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(215_20.2%_65.1%)] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))] dark:text-[hsl(var(--muted-foreground))]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`Foto de ${session.display_name}`} className="h-full w-full object-cover" />
              ) : (
                <UserRound size={16} />
              )}
            </div>
            {!isDesktopSidebarCollapsed && (
              <div>
                <p className="m-0 text-[0.92rem] leading-[1.2] text-[hsl(210_40%_98%)] dark:text-[hsl(var(--foreground))]">{session.display_name}</p>
                <p className="m-0 text-[0.78rem] text-[hsl(215_20.2%_65.1%)] dark:text-[hsl(var(--muted-foreground))]">@{session.username}</p>
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(217.2_32.6%_22%)] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--background))] dark:text-[hsl(var(--foreground))] dark:hover:bg-[hsl(var(--accent))]"
              onClick={() => setIsSettingsOpen((state) => !state)}
              title="Configuracoes"
            >
              <Settings size={14} />
              {!isDesktopSidebarCollapsed && <span>Configuracoes</span>}
            </Button>

            {isSettingsOpen && (
              <div className="mt-2 flex flex-col gap-2 rounded-[calc(var(--radius)-2px)] border border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] p-2 dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--card))]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[hsl(217.2_32.6%_17.5%)] bg-[hsl(217.2_32.6%_17.5%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(217.2_32.6%_22%)] dark:border-[hsl(var(--border))] dark:bg-[hsl(var(--background))] dark:text-[hsl(var(--foreground))] dark:hover:bg-[hsl(var(--accent))]"
                  onClick={handleOpenProfileModal}
                >
                  <Pencil size={14} />
                  <span>Editar perfil</span>
                </Button>
                <ThemeToggle />
                <Button type="button" variant="destructive" size="sm" onClick={handleLogout}>
                  <LogOut size={14} />
                  <span>Logout</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-[hsl(222_30%_8%/0.55)] px-4 py-6 backdrop-blur-[4px]">
          <div className="w-full max-w-lg rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 text-[hsl(var(--foreground))] shadow-[0_20px_48px_hsl(var(--foreground)/0.2)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="m-0 text-lg font-semibold">Editar Perfil</h2>
                <p className="m-0 text-sm text-[hsl(var(--muted-foreground))]">
                  Atualize seu nome, email e foto por aqui.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsProfileModalOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>

            {!hasEditorImage && (
              <div className="mb-4 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-4">
              <div className="mx-auto mb-3 w-fit">
                <button
                  type="button"
                  onClick={handlePickAvatar}
                  className="group relative block h-36 w-36 cursor-pointer overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--card))]"
                  disabled={isSavingProfile || isLoadingProfile}
                  title="Editar foto de perfil"
                >
                  {avatarDisplayImage ? (
                    <img
                      src={avatarDisplayImage}
                      alt={`Foto de ${session.display_name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[hsl(var(--muted-foreground))]">
                      <UserRound size={44} />
                    </span>
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-[hsl(222_47%_11%/0.5)] opacity-0 transition-opacity group-hover:opacity-100">
                    <Pencil size={22} className="text-[hsl(210_40%_98%)]" />
                  </span>
                </button>
              </div>
              <div className="text-center">
                <p className="m-0 truncate text-sm font-semibold">{session.username}</p>
              </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
              disabled={isSavingProfile || isLoadingProfile}
            />

            {hasEditorImage && (
              <div className="mb-4 grid gap-2 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5">
                <div className="mb-1 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePickAvatar}
                    disabled={isSavingProfile || isLoadingProfile}
                  >
                    <Pencil size={14} />
                    <span>Escolher Outra Imagem</span>
                  </Button>
                </div>
                <div className="flex justify-center py-1">
                  <div
                    className={cn(
                      'relative h-[240px] w-[240px] overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]',
                      isDraggingAvatar ? 'cursor-grabbing' : 'cursor-grab',
                    )}
                    onPointerDown={handleAvatarDragStart}
                    onPointerMove={handleAvatarDragMove}
                    onPointerUp={handleAvatarDragEnd}
                    onPointerCancel={handleAvatarDragEnd}
                  >
                    <img
                      src={avatarPreviewImage}
                      alt={`Recorte da foto de ${session.display_name}`}
                      className="pointer-events-none absolute select-none"
                      draggable={false}
                      style={{
                        width: `${editorBaseWidth}px`,
                        height: `${editorBaseHeight}px`,
                        left: `calc(50% + ${avatarOffsetX}px)`,
                        top: `calc(50% + ${avatarOffsetY}px)`,
                        transform: `translate(-50%, -50%) scale(${avatarZoom})`,
                        transformOrigin: 'center center',
                      }}
                    />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[188px] w-[188px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[hsl(210_40%_98%/0.48)] shadow-[0_0_0_9999px_hsl(222_47%_11%/0.56)]" />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[188px] w-[188px] -translate-x-1/2 -translate-y-1/2 rounded-full">
                      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-[hsl(210_40%_98%/0.24)]" />
                      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[hsl(210_40%_98%/0.24)]" />
                    </div>
                  </div>
                </div>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={2.6}
                    step={0.01}
                    value={avatarZoom}
                    onChange={(event) => setAvatarZoom(Number(event.target.value))}
                    disabled={isSavingProfile || isLoadingProfile}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Posicao horizontal</span>
                  <input
                    type="range"
                    min={-maxOffsetX}
                    max={maxOffsetX}
                    step={1}
                    value={avatarOffsetX}
                    onChange={(event) =>
                      setAvatarOffsetX(clampValue(Number(event.target.value), -maxOffsetX, maxOffsetX))
                    }
                    disabled={isSavingProfile || isLoadingProfile}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Posicao vertical</span>
                  <input
                    type="range"
                    min={-maxOffsetY}
                    max={maxOffsetY}
                    step={1}
                    value={avatarOffsetY}
                    onChange={(event) =>
                      setAvatarOffsetY(clampValue(Number(event.target.value), -maxOffsetY, maxOffsetY))
                    }
                    disabled={isSavingProfile || isLoadingProfile}
                  />
                </label>
                <p className="m-0 text-[11px] text-[hsl(var(--muted-foreground))]">
                  Arraste a imagem dentro da area para posicionar, como no Discord.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">Nome</span>
                <Input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  placeholder="Seu nome"
                  disabled={isSavingProfile || isLoadingProfile}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                  <Mail size={12} />
                  Email
                </span>
                <Input
                  type="email"
                  value={profileEmail}
                  onChange={(event) => setProfileEmail(event.target.value)}
                  placeholder="seuemail@dominio.com"
                  disabled={isSavingProfile || isLoadingProfile}
                />
                {!hasRegisteredEmail && (
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                    Nenhum email cadastrado. Coloque um endereco de email.
                  </span>
                )}
              </label>

            </div>

            {profileError && (
              <p className="mt-3 mb-0 text-sm font-semibold text-[hsl(var(--destructive))]">{profileError}</p>
            )}
            {isLoadingProfile && (
              <p className="mt-3 mb-0 text-sm font-medium text-[hsl(var(--muted-foreground))]">
                Carregando dados mais recentes do perfil...
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsProfileModalOpen(false)}
                disabled={isSavingProfile || isLoadingProfile}
              >
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={handleSaveProfile} disabled={isSavingProfile || isLoadingProfile}>
                {isSavingProfile ? 'Salvando...' : 'Salvar alteracoes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <section
        className={cn(
          'ml-[280px] h-screen w-[calc(100%_-_280px)] max-w-[calc(100%_-_280px)] overflow-y-auto p-6 transition-[margin-left,width,max-width] duration-200 max-[900px]:m-0 max-[900px]:h-auto max-[900px]:w-full max-[900px]:max-w-full max-[900px]:overflow-visible max-[900px]:p-4',
          isDesktopSidebarCollapsed && '!ml-[84px] !w-[calc(100%_-_84px)] !max-w-[calc(100%_-_84px)] max-[900px]:!m-0 max-[900px]:!w-full max-[900px]:!max-w-full',
        )}
      >
        <header className="mb-3.5 hidden max-[900px]:flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-auto"
            onClick={() => setIsMobileSidebarOpen((state) => !state)}
          >
            {isMobileSidebarOpen ? <X size={16} /> : <Menu size={16} />}
            <span>Menu</span>
          </Button>
        </header>
        <Outlet />
      </section>
    </main>
  )
}
