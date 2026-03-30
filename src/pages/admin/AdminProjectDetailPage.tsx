import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { sendProjectStatusEmail } from '../../features/notifications/projectEmails'
import { getProjectTimeline, type ProjectTimeline } from '../../features/projects/projectTimeline'
import {
  decideAdminProject,
  type AdminProjectStatus,
  getAdminProjectDetail,
  type AdminProjectDetail,
} from '../../features/projects/adminProjects'
import {
  backLinkClassName,
  errorClassName,
  noteClassName,
  panelClassName,
  panelFlatClassName,
  statusBadgeClassName,
} from '../../features/projects/projectUi'
import { projectStatusLabel } from '../../features/projects/userProjects'

export function AdminProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<AdminProjectDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeciding, setIsDeciding] = useState(false)
  const [error, setError] = useState('')
  const [adminMessage, setAdminMessage] = useState('')
  const [timeline, setTimeline] = useState<ProjectTimeline | null>(null)

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        setError('Projeto invalido.')
        setIsLoading(false)
        return
      }

      setError('')
      setIsLoading(true)
      try {
        const [data, timelineData] = await Promise.all([
          getAdminProjectDetail(projectId),
          getProjectTimeline(projectId),
        ])
        setProject(data)
        setTimeline(timelineData)
      } catch (err) {
        const nextError = err instanceof Error ? err.message : 'Falha ao carregar projeto.'
        setError(nextError)
      } finally {
        setIsLoading(false)
      }
    }

    loadProject()
  }, [projectId])

  const handleDecision = async (
    decision: Extract<AdminProjectStatus, 'aprovado' | 'reprovado' | 'em_ajustes'>,
  ) => {
    if (!projectId) return

    setError('')
    setIsDeciding(true)

    try {
      const result = await decideAdminProject(projectId, decision, adminMessage)

      if (result.recipient_email) {
        try {
          await sendProjectStatusEmail({
            projectId: result.id,
            recipientEmail: result.recipient_email,
            recipientName: result.professor_name,
            projectTitle: result.project_title,
            decision: result.status,
            adminMessage: result.admin_message,
          })
        } catch {
          setError('Decisao registrada, mas nao foi possivel enviar o e-mail.')
          setIsDeciding(false)
          return
        }
      }

      navigate('/admin/projetos')
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao registrar decisao.'
      setError(nextError)
    } finally {
      setIsDeciding(false)
    }
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

  const latestTimelineIndex = timelineSteps.reduce((latest, step, index) => (step.date ? index : latest), -1)
  const approvalStatusLabel =
    project?.status === 'aprovado' ? 'Aprovado' : project?.status === 'reprovado' ? 'Recusado' : 'Pendente'
  const approvalStatusDate =
    project?.status === 'aprovado' ? timeline?.approved_at ?? null : project?.status === 'reprovado' ? timeline?.rejected_at ?? null : null
  const professorAvatarUrl = project?.professor_avatar_url?.trim() || null
  const professorInitial = project?.professor?.trim().charAt(0).toUpperCase() || '?'

  return (
    <article className={`${panelClassName} ${panelFlatClassName}`}>
      <Link to="/admin/projetos" className={backLinkClassName}>
        <ArrowLeft size={14} />
        <span>Voltar para projetos</span>
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

              <div className="mt-3 rounded-[calc(var(--radius)-3px)] border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] px-2.5 py-2">
                <p className="m-0 text-[0.72rem] uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Status de aprovacao</p>
                <p className="mt-1 text-[0.95rem] font-bold text-[hsl(var(--foreground))]">{approvalStatusLabel}</p>
                <p className="mt-1 text-[0.82rem] text-[hsl(var(--muted-foreground))]">{formatTimelineDate(approvalStatusDate)}</p>
              </div>

              <section className="grid grid-cols-1 gap-y-2.5 gap-x-3 md:grid-cols-2">
                <div className="min-w-0">
                  <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Professor</p>
                  <p className="mt-1 text-[0.98rem] text-[hsl(var(--foreground))] break-words">{project.professor}</p>
                </div>
                <div className="min-w-0">
                  <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Disciplina</p>
                  <p className="mt-1 text-[0.98rem] text-[hsl(var(--foreground))] break-words">{project.discipline}</p>
                </div>
                <div className="min-w-0">
                  <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Curso</p>
                  <p className="mt-1 text-[0.98rem] text-[hsl(var(--foreground))] break-words">{project.course}</p>
                </div>
                <div className="min-w-0">
                  <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.04em] text-[hsl(var(--muted-foreground))]">Escola</p>
                  <p className="mt-1 text-[0.98rem] text-[hsl(var(--foreground))] break-words">{project.school}</p>
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

              <label className="flex flex-col gap-1.5 text-[0.9rem] font-semibold">
                Mensagem ao professor
                <Textarea
                  value={adminMessage}
                  onChange={(event) => setAdminMessage(event.target.value)}
                  rows={5}
                  placeholder="Opcional para aprovado. Use para orientar em caso de recusa ou ajustes."
                  disabled={isDeciding}
                />
              </label>

              <div className="mt-3.5 flex gap-2.5">
                <Button type="button" size="sm" onClick={() => handleDecision('aprovado')} disabled={isDeciding}>
                  {isDeciding ? 'Processando...' : 'Aprovar'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => handleDecision('em_ajustes')} disabled={isDeciding}>
                  {isDeciding ? 'Processando...' : 'Solicitar ajustes'}
                </Button>
                <Button type="button" variant="destructive" size="sm" onClick={() => handleDecision('reprovado')} disabled={isDeciding}>
                  {isDeciding ? 'Processando...' : 'Recusar'}
                </Button>
              </div>
            </div>
          </section>

          <aside className="sticky top-4 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 max-lg:static">
            <span className={`${statusBadgeClassName(project.status)} mb-3 inline-flex`}>
              {projectStatusLabel[project.status]}
            </span>
            <div className="my-3 flex flex-col items-start gap-2 rounded-[calc(var(--radius)-3px)] border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] p-2.5 text-left">
              <p className="m-0 text-[0.72rem] uppercase tracking-[0.03em] text-[hsl(var(--muted-foreground))]">Atribuido por:</p>
              <div className="flex min-h-[34px] w-full items-center justify-start gap-2.5">
                <div className="grid h-[34px] w-[34px] place-items-center overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] font-bold text-[hsl(var(--muted-foreground))]" aria-hidden="true">
                  {professorAvatarUrl ? <img src={professorAvatarUrl} alt={`Foto de ${project.professor}`} className="h-full w-full object-cover" /> : <span>{professorInitial}</span>}
                </div>
                <p className="m-0 overflow-hidden text-ellipsis text-[0.9rem] leading-none font-bold whitespace-nowrap text-[hsl(var(--foreground))]">{project.professor}</p>
              </div>
            </div>
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
    </article>
  )
}
