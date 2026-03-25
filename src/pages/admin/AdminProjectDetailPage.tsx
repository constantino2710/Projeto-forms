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
        const data = await getAdminProjectDetail(projectId)
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

    loadProject()
  }, [projectId])

  const handleDecision = async (
    decision: Extract<AdminProjectStatus, 'aprovado' | 'reprovado' | 'em_ajustes'>,
  ) => {
    if (!projectId) {
      return
    }

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
    if (!value) {
      return 'Aguardando'
    }
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
  const latestTimelineIndex = timelineSteps.reduce(
    (latest, step, index) => (step.date ? index : latest),
    -1,
  )
  const approvalStatusLabel =
    project?.status === 'aprovado'
      ? 'Aprovado'
      : project?.status === 'reprovado'
        ? 'Recusado'
        : 'Pendente'
  const approvalStatusDate =
    project?.status === 'aprovado'
      ? timeline?.approved_at ?? null
      : project?.status === 'reprovado'
        ? timeline?.rejected_at ?? null
        : null

  return (
    <article className="dashboard-panel dashboard-panel-flat">
      <Link to="/admin/projetos" className="back-link">
        <ArrowLeft size={14} />
        <span>Voltar para projetos</span>
      </Link>

      {isLoading && <p className="dashboard-note">Carregando projeto...</p>}
      {error && <p className="error">{error}</p>}

      {!isLoading && project && (
        <div className="project-two-cards">
          <section className="project-main-card">
            <div className="project-detail">
              <div className="project-card-top">
                <h1>{project.title}</h1>
              </div>

              <div className="project-approval-chip">
                <p className="project-approval-label">Status de aprovacao</p>
                <p className="project-approval-value">{approvalStatusLabel}</p>
                <p className="project-approval-date">{formatTimelineDate(approvalStatusDate)}</p>
              </div>

              <section className="project-info-grid">
                <div className="project-info-item">
                  <p className="project-info-label">Professor</p>
                  <p className="project-info-value">{project.professor}</p>
                </div>
                <div className="project-info-item">
                  <p className="project-info-label">Disciplina</p>
                  <p className="project-info-value">{project.discipline}</p>
                </div>
                <div className="project-info-item">
                  <p className="project-info-label">Curso</p>
                  <p className="project-info-value">{project.course}</p>
                </div>
                <div className="project-info-item">
                  <p className="project-info-label">Periodo</p>
                  <p className="project-info-value">
                    {project.period_start} ate {project.period_end}
                  </p>
                </div>
                <div className="project-info-item">
                  <p className="project-info-label">Publico-alvo</p>
                  <p className="project-info-value">{project.target_audience}</p>
                </div>
                <div className="project-info-item">
                  <p className="project-info-label">Orcamento</p>
                  <p className="project-info-value">R$ {Number(project.budget).toFixed(2)}</p>
                </div>
                <div className="project-info-item project-info-item-full">
                  <p className="project-info-label">Descricao</p>
                  <p className="project-info-value">{project.description}</p>
                </div>
              </section>

              <label>
                Mensagem ao professor
                <Textarea
                  value={adminMessage}
                  onChange={(event) => setAdminMessage(event.target.value)}
                  rows={5}
                  placeholder="Opcional para aprovado. Use para orientar em caso de recusa ou ajustes."
                  disabled={isDeciding}
                />
              </label>

              <div className="project-detail-actions">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleDecision('aprovado')}
                  disabled={isDeciding}
                >
                  {isDeciding ? 'Processando...' : 'Aprovar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecision('em_ajustes')}
                  disabled={isDeciding}
                >
                  {isDeciding ? 'Processando...' : 'Solicitar ajustes'}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDecision('reprovado')}
                  disabled={isDeciding}
                >
                  {isDeciding ? 'Processando...' : 'Recusar'}
                </Button>
              </div>
            </div>
          </section>

          <aside className="timeline-side-card">
            <span className={`status-badge status-${project.status} timeline-status-badge`}>
              {projectStatusLabel[project.status]}
            </span>
            <h2>Linha do tempo</h2>
            {timelineSteps.map((step, index) => {
              const isLatest = step.date !== null && index === latestTimelineIndex
              const rowClass = isLatest
                ? 'timeline-row timeline-row-latest'
                : step.date
                  ? 'timeline-row'
                  : 'timeline-row timeline-row-future'

              return (
                <p key={step.key} className={rowClass}>
                  <strong>{step.label}:</strong>{' '}
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
