import { ArrowLeft, Trash2 } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import {
  deleteProjectAttachment,
  listProjectAttachments,
  type ProjectAttachment,
  uploadProjectAttachment,
} from '../../features/projects/projectAttachments'
import {
  getMyProjectDetail,
  listProjectCatalogOptions,
  projectStatusLabel,
  updateMyProjectDetails,
  updateMyProjectStatus,
  deleteMyProject,
  type UserProject,
} from '../../features/projects/userProjects'
import {
  getProjectTimeline,
  type ProjectTimeline,
} from '../../features/projects/projectTimeline'
import {
  backLinkClassName,
  errorClassName,
  noteClassName,
  panelClassName,
  panelFlatClassName,
  statusBadgeClassName,
} from '../../features/projects/projectUi'

type EditFormState = {
  title: string
  thematicArea: string
  course: string
  school: string
  periodStart: string
  periodEnd: string
  targetAudience: string
  budget: string
  description: string
}

export function UserProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<UserProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([])
  const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false)
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [attachmentError, setAttachmentError] = useState('')
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [timeline, setTimeline] = useState<ProjectTimeline | null>(null)
  const [courseOptions, setCourseOptions] = useState<string[]>([])
  const [schoolOptions, setSchoolOptions] = useState<string[]>([])

  const loadProject = async () => {
    if (!projectId) {
      setError('Projeto invalido.')
      setIsLoading(false)
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const data = await getMyProjectDetail(projectId)
      const timelineData = await getProjectTimeline(projectId)
      setProject(data)
      setTimeline(timelineData)
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao carregar projeto.'
      setError(nextError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProject()
  }, [projectId])

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const options = await listProjectCatalogOptions()
        setCourseOptions(options.courses)
        setSchoolOptions(options.schools)
      } catch {
        setCourseOptions([])
        setSchoolOptions([])
      }
    }

    loadCatalog()
  }, [])

  const loadAttachments = async () => {
    if (!projectId) {
      return
    }

    setAttachmentError('')
    setIsAttachmentsLoading(true)

    try {
      const data = await listProjectAttachments(projectId)
      setAttachments(data)
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao carregar anexos.'
      setAttachmentError(nextError)
    } finally {
      setIsAttachmentsLoading(false)
    }
  }

  useEffect(() => {
    loadAttachments()
  }, [projectId])

  const startEdit = () => {
    if (!project || (project.status !== 'rascunho' && project.status !== 'em_ajustes')) {
      return
    }

    setIsEditing(true)
    setEditForm({
      title: project.title,
      thematicArea: project.thematic_area,
      course: project.course ?? '',
      school: project.school ?? '',
      periodStart: project.period_start,
      periodEnd: project.period_end,
      targetAudience: project.target_audience,
      budget: String(project.budget),
      description: project.description ?? '',
    })
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditForm(null)
  }

  const handleSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!project || !editForm) return

    setError('')
    setIsSubmitting(true)

    try {
      await updateMyProjectDetails({
        projectId: project.id,
        title: editForm.title,
        thematicArea: editForm.thematicArea,
        course: editForm.course,
        school: editForm.school,
        periodStart: editForm.periodStart,
        periodEnd: editForm.periodEnd,
        targetAudience: editForm.targetAudience,
        budget: Number(editForm.budget || 0),
        description: editForm.description,
      })

      cancelEdit()
      await loadProject()
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao salvar alteracoes.'
      setError(nextError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusToggle = async () => {
    if (
      !project ||
      (project.status !== 'rascunho' &&
        project.status !== 'submetido' &&
        project.status !== 'em_ajustes')
    ) {
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const nextStatus = project.status === 'submetido' ? 'rascunho' : 'submetido'
      await updateMyProjectStatus(project.id, nextStatus)
      await loadProject()
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao atualizar status.'
      setError(nextError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!project || project.status !== 'rascunho') return

    setError('')
    setIsDeleting(true)

    try {
      await deleteMyProject(project.id)
      setIsDeleteModalOpen(false)
      navigate('/usuario/meus-projetos')
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao excluir rascunho.'
      setError(nextError)
      setIsDeleting(false)
    }
  }

  const formatAttachmentSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatTimelineDate = (value: string | null) => {
    if (!value) return 'Aguardando'
    return new Date(value).toLocaleString('pt-BR')
  }

  const timelineSteps = [
    { key: 'created', label: 'Criado', date: timeline?.created_at ?? null },
    { key: 'submitted', label: 'Submetido', date: timeline?.submitted_at ?? null },
    { key: 'analysis', label: 'Em analise', date: timeline?.analysis_started_at ?? null },
    {
      key: 'approval_status',
      label: 'Status da aprovacao',
      date: timeline?.approved_at ?? timeline?.rejected_at ?? null,
    },
  ]

  const approvalStatusLabel =
    timeline?.approved_at !== null
      ? 'Aprovado'
      : timeline?.rejected_at !== null
        ? 'Recusado'
        : 'Pendente'

  const latestTimelineIndex = timelineSteps.reduce(
    (latest, step, index) => (step.date ? index : latest),
    -1,
  )

  const handleUploadAttachment = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !projectId) return

    setAttachmentError('')
    setIsUploadingAttachment(true)

    try {
      await uploadProjectAttachment(projectId, file)
      await loadAttachments()
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao enviar anexo.'
      setAttachmentError(nextError)
    } finally {
      setIsUploadingAttachment(false)
      event.target.value = ''
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!projectId) return

    setAttachmentError('')
    setDeletingAttachmentId(attachmentId)

    try {
      await deleteProjectAttachment(projectId, attachmentId)
      await loadAttachments()
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao excluir anexo.'
      setAttachmentError(nextError)
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  return (
    <article className={`${panelClassName} ${panelFlatClassName}`}>
      <Link to="/usuario/meus-projetos" className={backLinkClassName}>
        <ArrowLeft size={14} />
        <span>Voltar para meus projetos</span>
      </Link>

      {isLoading && <p className={noteClassName}>Carregando projeto...</p>}
      {error && <p className={errorClassName}>{error}</p>}

      {!isLoading && project && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-[calc(var(--radius)-2px)] bg-[hsl(var(--background))] p-3.5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h1 className="m-0 text-[1.4rem]">{project.title}</h1>
              </div>

              {!isEditing ? (
                <>
                  <section className="grid grid-cols-1 gap-y-2.5 gap-x-3 md:grid-cols-2">
                    <div className="min-w-0">
                      <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Area</p>
                      <p className="mt-1 text-[0.98rem] text-[hsl(var(--foreground))] break-words">{project.thematic_area}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Curso</p>
                      <p className="mt-1 text-[0.98rem] text-[hsl(var(--foreground))] break-words">{project.course || '-'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Escola</p>
                      <p className="mt-1 text-[0.98rem] text-[hsl(var(--foreground))] break-words">{project.school || '-'}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Periodo</p>
                      <p className="mt-1 text-[0.98rem] text-[hsl(var(--foreground))] break-words">{project.period_start} ate {project.period_end}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Publico-alvo</p>
                      <p className="mt-1 text-[0.98rem] text-[hsl(var(--foreground))] break-words">{project.target_audience}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Orcamento</p>
                      <p className="mt-1 text-[0.98rem] text-[hsl(var(--foreground))] break-words">R$ {Number(project.budget).toFixed(2)}</p>
                    </div>
                    <div className="col-span-full min-w-0">
                      <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Descricao</p>
                      <p className="mt-1 text-[0.98rem] text-[hsl(var(--foreground))] break-words">{project.description}</p>
                    </div>
                  </section>

                  {project.admin_message && (
                    <div className="rounded-[calc(var(--radius)-3px)] border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] p-2.5">
                      <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Mensagem da avaliacao</p>
                      <p className="mt-1 text-[0.98rem] text-[hsl(var(--foreground))] break-words">{project.admin_message}</p>
                    </div>
                  )}

                  <div className="mt-3.5 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      {(project.status === 'rascunho' || project.status === 'em_ajustes') && (
                        <Button type="button" variant="outline" size="sm" onClick={startEdit}>
                          Editar
                        </Button>
                      )}
                      {(project.status === 'rascunho' || project.status === 'submetido' || project.status === 'em_ajustes') && (
                        <Button type="button" size="sm" onClick={handleStatusToggle} disabled={isSubmitting || isDeleting}>
                          {isSubmitting
                            ? 'Atualizando...'
                            : project.status === 'submetido'
                              ? 'Voltar para rascunho'
                              : project.status === 'em_ajustes'
                                ? 'Reenviar para avaliacao'
                                : 'Submeter'}
                        </Button>
                      )}
                    </div>

                    {project.status === 'rascunho' && (
                      <button
                        type="button"
                        className="inline-flex h-[2.3rem] w-[2.3rem] cursor-pointer items-center justify-center rounded-full border border-[hsl(var(--destructive)/0.55)] bg-black text-[hsl(var(--destructive))] transition-[transform,background-color,border-color] hover:-translate-y-px hover:border-[hsl(var(--destructive)/0.7)] hover:bg-[hsl(0_0%_8%)] disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={isDeleting || isSubmitting}
                        aria-label="Excluir rascunho"
                        title="Excluir rascunho"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <section className="mt-5 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
                    <div className="flex items-center justify-between gap-2 max-[900px]:flex-col max-[900px]:items-stretch">
                      <h2 className="m-0 text-base">Anexos</h2>
                      <label>
                        <Input
                          className="min-h-[2.2rem] px-[0.6rem] py-[0.35rem]"
                          type="file"
                          onChange={handleUploadAttachment}
                          disabled={isUploadingAttachment}
                        />
                      </label>
                    </div>

                    <p className={noteClassName}>Envie arquivos de apoio (PDF, imagens, DOC, XLS, PPT) ate 20 MB.</p>

                    {isAttachmentsLoading && <p className={noteClassName}>Carregando anexos...</p>}
                    {attachmentError && <p className={errorClassName}>{attachmentError}</p>}

                    {!isAttachmentsLoading && attachments.length === 0 && (
                      <p className={noteClassName}>Nenhum anexo enviado.</p>
                    )}

                    {!isAttachmentsLoading && attachments.length > 0 && (
                      <ul className="mt-2.5 m-0 flex list-none flex-col gap-2 p-0">
                        {attachments.map((attachment) => (
                          <li
                            key={attachment.id}
                            className="flex items-center justify-between gap-2.5 rounded-[calc(var(--radius)-4px)] border border-[hsl(var(--border))] p-2.5 max-[900px]:flex-col max-[900px]:items-start"
                          >
                            <div>
                              <p className="m-0 font-semibold text-[hsl(var(--foreground))]">{attachment.file_name}</p>
                              <p className="mt-1 text-[0.8rem] text-[hsl(var(--muted-foreground))]">
                                {formatAttachmentSize(attachment.size_bytes)} - {new Date(attachment.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 max-[900px]:w-full max-[900px]:justify-between">
                              {attachment.download_url && (
                                <a
                                  href={attachment.download_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[0.88rem] font-semibold text-[hsl(var(--primary))] hover:underline"
                                >
                                  Baixar
                                </a>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                disabled={deletingAttachmentId === attachment.id}
                              >
                                {deletingAttachmentId === attachment.id ? 'Excluindo...' : 'Excluir'}
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              ) : (
                <form className="mt-4 flex flex-col gap-3" onSubmit={handleSaveEdit}>
                  <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
                    Titulo
                    <Input
                      value={editForm?.title ?? ''}
                      onChange={(event) =>
                        setEditForm((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                      }
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
                    Area tematica
                    <Input
                      value={editForm?.thematicArea ?? ''}
                      onChange={(event) =>
                        setEditForm((prev) => (prev ? { ...prev, thematicArea: event.target.value } : prev))
                      }
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
                    Curso
                    <select
                      value={editForm?.course ?? ''}
                      onChange={(event) =>
                        setEditForm((prev) => (prev ? { ...prev, course: event.target.value } : prev))
                      }
                      className="w-full min-h-11 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-[0.8rem] py-[0.65rem] text-[0.95rem] text-[hsl(var(--foreground))] transition-[border-color,box-shadow] focus:border-[hsl(var(--ring))] focus:shadow-[0_0_0_2px_hsl(var(--ring)/0.15)] focus:outline-none"
                      required
                    >
                      <option value="">Selecione um curso</option>
                      {courseOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
                    Escola
                    <select
                      value={editForm?.school ?? ''}
                      onChange={(event) =>
                        setEditForm((prev) => (prev ? { ...prev, school: event.target.value } : prev))
                      }
                      className="w-full min-h-11 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-[0.8rem] py-[0.65rem] text-[0.95rem] text-[hsl(var(--foreground))] transition-[border-color,box-shadow] focus:border-[hsl(var(--ring))] focus:shadow-[0_0_0_2px_hsl(var(--ring)/0.15)] focus:outline-none"
                      required
                    >
                      <option value="">Selecione uma escola</option>
                      {schoolOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
                      Inicio
                      <Input
                        type="date"
                        value={editForm?.periodStart ?? ''}
                        onChange={(event) =>
                          setEditForm((prev) => (prev ? { ...prev, periodStart: event.target.value } : prev))
                        }
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
                      Fim
                      <Input
                        type="date"
                        value={editForm?.periodEnd ?? ''}
                        onChange={(event) =>
                          setEditForm((prev) => (prev ? { ...prev, periodEnd: event.target.value } : prev))
                        }
                        required
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
                    Publico-alvo
                    <Input
                      value={editForm?.targetAudience ?? ''}
                      onChange={(event) =>
                        setEditForm((prev) => (prev ? { ...prev, targetAudience: event.target.value } : prev))
                      }
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
                    Orcamento
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={editForm?.budget ?? ''}
                      onChange={(event) =>
                        setEditForm((prev) => (prev ? { ...prev, budget: event.target.value } : prev))
                      }
                      required
                    />
                  </label>

                  <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
                    Descricao
                    <Textarea
                      value={editForm?.description ?? ''}
                      onChange={(event) =>
                        setEditForm((prev) => (prev ? { ...prev, description: event.target.value } : prev))
                      }
                      rows={6}
                      required
                    />
                  </label>

                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isSubmitting}>
                      {isSubmitting ? 'Salvando...' : 'Salvar alteracoes'}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </section>

          <aside className="sticky top-4 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 max-lg:static">
            <span className={`${statusBadgeClassName(project.status)} mb-3 inline-flex`}>
              {projectStatusLabel[project.status]}
            </span>
            <h2 className="m-0 text-[0.98rem]">Linha do tempo</h2>
            {timelineSteps.map((step, index) => {
              const isLatest = step.date !== null && index === latestTimelineIndex
              const rowClass = isLatest
                ? 'mt-2 text-[0.84rem] leading-normal font-bold text-[hsl(var(--foreground))]'
                : step.date
                  ? 'mt-2 text-[0.84rem] leading-normal text-[hsl(var(--muted-foreground))]'
                  : 'mt-2 text-[0.84rem] leading-normal text-[hsl(var(--muted-foreground))] opacity-40'

              return (
                <p key={step.key} className={rowClass}>
                  <strong className="text-[hsl(var(--foreground))]">{step.label}:</strong>{' '}
                  {step.key === 'approval_status'
                    ? `${approvalStatusLabel}${step.date ? ` (${formatTimelineDate(step.date)})` : ''}`
                    : formatTimelineDate(step.date)}
                </p>
              )
            })}
          </aside>
        </div>
      )}

      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-[hsl(0_0%_0%/0.7)] p-4"
          onClick={() => {
            if (!isDeleting) {
              setIsDeleteModalOpen(false)
            }
          }}
        >
          <div
            className="w-full max-w-[460px] rounded-[var(--radius)] border border-[hsl(0_0%_20%)] bg-black p-[18px] text-[hsl(0_0%_96%)] shadow-[0_22px_64px_hsl(0_0%_0%/0.55)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-draft-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-draft-title" className="m-0 text-[1.15rem] text-[hsl(0_0%_98%)]">Excluir rascunho?</h2>
            <p className="mt-2.5 text-[hsl(0_0%_74%)]">
              Este rascunho vai sumir da sua lista, mas os dados ficam salvos para recuperacao depois.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteProject}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar exclusao'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
