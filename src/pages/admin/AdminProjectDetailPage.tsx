import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Spinner } from '../../components/ui/spinner'
import { Textarea } from '../../components/ui/textarea'
import {
  ACKNOWLEDGEMENT_OPTIONS,
  createExtensionPlanFromProject,
  type ExtensionPlanData,
} from '../../features/projects/extensionPlan'
import { sendProjectStatusEmail } from '../../features/notifications/projectEmails'
import { getProjectTimeline, type ProjectTimeline } from '../../features/projects/projectTimeline'
import {
  decideAdminProject,
  type AdminProjectStatus,
  getAdminProjectDetail,
  type AdminProjectDetail,
} from '../../features/projects/adminProjects'
import { projectStatusLabel } from '../../features/projects/userProjects'
import { formLabelClass } from '../../lib/formStyles'
import {
  backLinkClass,
  dashboardNoteClass,
  dashboardPanelFlatClass,
  errorTextClass,
  projectApprovalChipClass,
  projectApprovalDateClass,
  projectApprovalLabelClass,
  projectApprovalValueClass,
  projectCardTopClass,
  projectDetailActionsClass,
  projectDetailClass,
  projectInfoGridClass,
  projectInfoItemClass,
  projectInfoItemFullClass,
  projectInfoLabelClass,
  projectInfoSectionClass,
  projectInfoValueClass,
  projectMainCardClass,
  projectSectionsStackClass,
  projectTwoCardsClass,
  statusBadgeBaseClass,
  statusColorMap,
  timelineRowClass,
  timelineRowFutureClass,
  timelineRowLatestClass,
  timelineSideCardClass,
  timelineStatusBadgeClass,
} from '../../lib/projectStyles'
import { cn } from '../../lib/utils'

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

  const renderExtensionSummary = (extensionForm: ExtensionPlanData) => (
    <div className={projectSectionsStackClass}>
      <section className={projectInfoSectionClass}>
        <h3>Identificacao da Iniciativa Extensionista</h3>
        <div className={projectInfoGridClass}>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Titulo da Iniciativa</p>
            <p className={projectInfoValueClass}>{extensionForm.title}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Carga horaria total</p>
            <p className={projectInfoValueClass}>{extensionForm.totalWorkload}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Programa Unicap</p>
            <p className={projectInfoValueClass}>{extensionForm.unicapProgram}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Periodo</p>
            <p className={projectInfoValueClass}>
              {extensionForm.periodStart} ate {extensionForm.periodEnd}
            </p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Curso ou programa vinculado</p>
            <p className={projectInfoValueClass}>{extensionForm.linkedCourse}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Curso</p>
            <p className={projectInfoValueClass}>{extensionForm.courseName}</p>
          </div>
        </div>
      </section>

      <section className={projectInfoSectionClass}>
        <h3>Docentes</h3>
        <div className={projectInfoGridClass}>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Professor</p>
            <p className={projectInfoValueClass}>{project?.professor}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Nome do docente coordenador</p>
            <p className={projectInfoValueClass}>{extensionForm.coordinatorName}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>E-mail do docente coordenador</p>
            <p className={projectInfoValueClass}>{extensionForm.coordinatorEmail}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>CPF do docente coordenador</p>
            <p className={projectInfoValueClass}>{extensionForm.coordinatorCpf}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Telefone (WhatsApp)</p>
            <p className={projectInfoValueClass}>{extensionForm.coordinatorPhone}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Participacao do Coordenador</p>
            <p className={projectInfoValueClass}>{extensionForm.coordinatorParticipation}</p>
          </div>
        </div>
      </section>

      <section className={projectInfoSectionClass}>
        <h3>Conteudo do Plano</h3>
        <div className={projectInfoGridClass}>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Objetivos de Aprendizagem</p>
            <p className={projectInfoValueClass}>{extensionForm.learningObjectives.filter(Boolean).join(' | ')}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Servico a ser oferecido</p>
            <p className={projectInfoValueClass}>{extensionForm.serviceOffered}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Atividades</p>
            <p className={projectInfoValueClass}>{extensionForm.activities.filter(Boolean).join(' | ')}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Problema ou Necessidade</p>
            <p className={projectInfoValueClass}>{extensionForm.problemStatement}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>ODS Impactado</p>
            <p className={projectInfoValueClass}>{extensionForm.sustainableDevelopmentGoal}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Publico atendido</p>
            <p className={projectInfoValueClass}>{extensionForm.targetAudience}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Resumo</p>
            <p className={projectInfoValueClass}>{extensionForm.projectSummary}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Informacoes adicionais</p>
            <p className={projectInfoValueClass}>{extensionForm.additionalInformation || '-'}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Confirmacoes marcadas</p>
            <p className={projectInfoValueClass}>
              {ACKNOWLEDGEMENT_OPTIONS.filter((item) =>
                extensionForm.acknowledgements.includes(item.id),
              )
                .map((item) => item.label)
                .join(' | ')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )

  return (
    <article className={dashboardPanelFlatClass}>
      <Link to="/admin/projetos" className={backLinkClass}>
        <ArrowLeft size={14} />
        <span>Voltar para projetos</span>
      </Link>

      {isLoading && (
        <div className="mt-4 flex justify-center text-muted-foreground">
          <Spinner />
        </div>
      )}
      {error && <p className={errorTextClass}>{error}</p>}

      {!isLoading && project && (
        <div className={projectTwoCardsClass}>
          <section className={projectMainCardClass}>
            <div className={projectDetailClass}>
              <div className={projectCardTopClass}>
                <h1>{project.title}</h1>
              </div>

              <div className={projectApprovalChipClass}>
                <p className={projectApprovalLabelClass}>Status de aprovacao</p>
                <p className={projectApprovalValueClass}>{approvalStatusLabel}</p>
                <p className={projectApprovalDateClass}>{formatTimelineDate(approvalStatusDate)}</p>
              </div>

              <section className={projectInfoGridClass}>
                {project.tipo === 'extensao' ? (
                  <div className={projectInfoItemFullClass}>
                    {renderExtensionSummary(createExtensionPlanFromProject(project))}
                  </div>
                ) : (
                  <>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Professor</p>
                      <p className={projectInfoValueClass}>{project.professor}</p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Disciplina</p>
                      <p className={projectInfoValueClass}>{project.discipline}</p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Curso</p>
                      <p className={projectInfoValueClass}>{project.course}</p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Periodo</p>
                      <p className={projectInfoValueClass}>
                        {project.period_start} ate {project.period_end}
                      </p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Publico-alvo</p>
                      <p className={projectInfoValueClass}>{project.target_audience}</p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Orcamento</p>
                      <p className={projectInfoValueClass}>R$ {Number(project.budget).toFixed(2)}</p>
                    </div>
                    <div className={projectInfoItemFullClass}>
                      <p className={projectInfoLabelClass}>Descricao</p>
                      <p className={projectInfoValueClass}>{project.description}</p>
                    </div>
                  </>
                )}
              </section>

              <label className={formLabelClass}>
                Mensagem ao professor
                <Textarea
                  value={adminMessage}
                  onChange={(event) => setAdminMessage(event.target.value)}
                  rows={5}
                  placeholder="Opcional para aprovado. Use para orientar em caso de recusa ou ajustes."
                  disabled={isDeciding}
                />
              </label>

              <div className={projectDetailActionsClass}>
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

          <aside className={timelineSideCardClass}>
            <span
              className={cn(
                statusBadgeBaseClass,
                statusColorMap[project.status],
                timelineStatusBadgeClass,
              )}
            >
              {projectStatusLabel[project.status]}
            </span>
            <h2>Linha do tempo</h2>
            {timelineSteps.map((step, index) => {
              const isLatest = step.date !== null && index === latestTimelineIndex
              const rowClass = isLatest
                ? cn(timelineRowClass, timelineRowLatestClass)
                : step.date
                  ? timelineRowClass
                  : cn(timelineRowClass, timelineRowFutureClass)

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
