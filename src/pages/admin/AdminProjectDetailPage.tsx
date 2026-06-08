import { ArrowLeft, FileText, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getStoredSessionRole } from '../../auth/appAuth'
import { Button } from '../../components/ui/button'
import { Spinner } from '../../components/ui/spinner'
import { Textarea } from '../../components/ui/textarea'
import {
  disciplineManagerialLabel,
  parseDisciplineMetadataDescription,
} from '../../features/disciplines/disciplineProjectMetadata'
import {
  ACKNOWLEDGEMENT_OPTIONS,
  createExtensionPlanFromProject,
  DISCIPLINE_ACKNOWLEDGEMENT_OPTIONS,
  type ExtensionPlanData,
} from '../../features/projects/extensionPlan'
import { sendProjectStatusEmail } from '../../features/notifications/projectEmails'
import { getProjectTimeline, type ProjectTimeline } from '../../features/projects/projectTimeline'
import {
  decideAdminProject,
  deleteAdminProject,
  type AdminDecisionStatus,
  getAdminProjectDetail,
  type AdminProjectDetail,
} from '../../features/projects/adminProjects'
import {
  buildSingleProjectPdfFilename,
  downloadBlob,
  generateSingleProjectPdf,
} from '../../features/reports/projectReports'
import { Input } from '../../components/ui/input'
import { projectStatusLabel } from '../../features/projects/userProjects'
import { formLabelClass } from '../../lib/formStyles'
import {
  backLinkClass,
  confirmModalActionsClass,
  confirmModalBackdropClass,
  confirmModalClass,
  dashboardPanelFlatClass,
  errorTextClass,
  successTextClass,
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
  const [notice, setNotice] = useState('')
  const [adminMessage, setAdminMessage] = useState('')
  const [timeline, setTimeline] = useState<ProjectTimeline | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const sessionRole = useMemo(() => getStoredSessionRole(), [])
  const isSuperadmin = sessionRole === 'superadmin'
  const approveDecision: AdminDecisionStatus = isSuperadmin ? 'aprovado' : 'pre_aprovado'
  const rejectDecision: AdminDecisionStatus = isSuperadmin ? 'reprovado' : 'pre_reprovado'
  const approveLabel = isSuperadmin ? 'Aprovar' : 'Pre-aprovar'
  const rejectLabel = isSuperadmin ? 'Recusar' : 'Pre-recusar'

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

  const handleDecision = async (decision: AdminDecisionStatus) => {
    if (!projectId) {
      return
    }

    setError('')
    setNotice('')
    setIsDeciding(true)

    try {
      const result = await decideAdminProject(projectId, decision, adminMessage)

      if (!result.recipient_email) {
        setNotice('Decisão registrada. Docente sem e-mail cadastrado, não foi notificado.')
        window.setTimeout(() => navigate('/admin/projetos'), 2500)
        return
      }

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
        setError('Decisão registrada, mas não foi possível enviar o e-mail.')
        window.setTimeout(() => navigate('/admin/projetos'), 2500)
        return
      }

      navigate('/admin/projetos')
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao registrar decisao.'
      setError(nextError)
    } finally {
      setIsDeciding(false)
    }
  }

  const closeDelete = () => {
    setIsDeleteOpen(false)
    setDeleteConfirmText('')
  }

  const handleDelete = async () => {
    if (!projectId) return
    setError('')
    setNotice('')
    setIsDeleting(true)
    try {
      await deleteAdminProject(projectId)
      closeDelete()
      navigate('/admin/projetos')
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao excluir projeto.'
      setError(nextError)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGeneratePdf = async () => {
    if (!project) return
    setError('')
    setIsGeneratingPdf(true)
    try {
      const blob = await generateSingleProjectPdf(project, timeline)
      downloadBlob(blob, buildSingleProjectPdfFilename(project))
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao gerar PDF.'
      setError(nextError)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const formatTimelineDate = (value: string | null) => {
    if (!value) {
      return 'Aguardando'
    }
    return new Date(value).toLocaleString('pt-BR')
  }

  const approvalStatusDate =
    project?.status === 'aprovado'
      ? timeline?.approved_at ?? null
      : project?.status === 'reprovado'
        ? timeline?.rejected_at ?? null
        : project?.status === 'pre_aprovado' || project?.status === 'pre_reprovado'
          ? timeline?.reviewed_at ?? null
          : null
  const approvalStatusLabel =
    project?.status === 'aprovado'
      ? 'Aprovado'
      : project?.status === 'reprovado'
        ? 'Recusado'
        : project?.status === 'pre_aprovado'
          ? 'Pre-aprovado'
          : project?.status === 'pre_reprovado'
            ? 'Pre-reprovado'
            : 'Pendente'
  const timelineSteps = [
    { key: 'created', label: 'Criado', date: timeline?.created_at ?? null },
    { key: 'submitted', label: 'Submetido', date: timeline?.submitted_at ?? null },
    { key: 'analysis', label: 'Em análise', date: timeline?.analysis_started_at ?? null },
    {
      key: 'approval_status',
      label: 'Status da aprovação',
      date: approvalStatusDate,
    },
  ]
  const latestTimelineIndex = timelineSteps.reduce(
    (latest, step, index) => (step.date ? index : latest),
    -1,
  )

  const decisionVerb =
    project?.status === 'aprovado'
      ? 'Aprovado'
      : project?.status === 'reprovado'
        ? 'Recusado'
        : project?.status === 'pre_aprovado'
          ? 'Pre-aprovado'
          : project?.status === 'pre_reprovado'
            ? 'Pre-reprovado'
            : project?.status === 'em_ajustes'
              ? 'Enviado para ajustes'
              : null
  const analyzingName = project?.analyzing_by_name ?? null
  const reviewedName = project?.reviewed_by_name ?? null
  let analysisHighlight: string | null = null
  let decisionHighlight: string | null = null
  if (project) {
    if (decisionVerb && reviewedName) {
      decisionHighlight = `${decisionVerb} por ${reviewedName}`
      if (analyzingName && analyzingName !== reviewedName) {
        analysisHighlight = `Analisado por ${analyzingName}`
      }
    } else if (project.status === 'em_avaliacao' && analyzingName) {
      analysisHighlight = `Em análise por ${analyzingName}`
    }
  }
  const disciplineMetadata =
    project?.tipo === 'disciplina'
      ? parseDisciplineMetadataDescription(project.description)
      : null
  const disciplineExtensionForm =
    project?.tipo === 'disciplina' && project.extension_form
      ? createExtensionPlanFromProject(project)
      : null

  const renderExtensionSummary = (
    extensionForm: ExtensionPlanData,
    acknowledgementOptions: readonly { id: string; label: string }[] = ACKNOWLEDGEMENT_OPTIONS,
    mode: 'full' | 'axes-only' = 'full',
  ) => (
    <div className={projectSectionsStackClass}>
      {mode === 'full' && (
        <>
          <section className={projectInfoSectionClass}>
            <h3>Identificação da Iniciativa Extensionista</h3>
            <div className={projectInfoGridClass}>
              <div className={projectInfoItemClass}>
                <p className={projectInfoLabelClass}>Título da Iniciativa</p>
                <p className={projectInfoValueClass}>{extensionForm.title}</p>
              </div>
              <div className={projectInfoItemClass}>
                <p className={projectInfoLabelClass}>Carga horária total</p>
                <p className={projectInfoValueClass}>{extensionForm.totalWorkload}</p>
              </div>
              <div className={projectInfoItemClass}>
                <p className={projectInfoLabelClass}>Programa Unicap</p>
                <p className={projectInfoValueClass}>{extensionForm.unicapProgram}</p>
              </div>
              <div className={projectInfoItemClass}>
                <p className={projectInfoLabelClass}>Período</p>
                <p className={projectInfoValueClass}>
                  {extensionForm.periodStart} até {extensionForm.periodEnd}
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
                <p className={projectInfoLabelClass}>Docente</p>
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
                <p className={projectInfoLabelClass}>Participação do Coordenador</p>
                <p className={projectInfoValueClass}>{extensionForm.coordinatorParticipation}</p>
              </div>
            </div>
          </section>
        </>
      )}

      <section className={projectInfoSectionClass}>
        <h3>Conteúdo do Plano</h3>
        <div className={projectInfoGridClass}>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Objetivos de Aprendizagem</p>
            <p className={projectInfoValueClass}>{extensionForm.learningObjectives.filter(Boolean).join(' | ')}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Serviço a ser oferecido</p>
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
            <p className={projectInfoLabelClass}>Público atendido</p>
            <p className={projectInfoValueClass}>{extensionForm.targetAudience}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Resumo</p>
            <p className={projectInfoValueClass}>{extensionForm.projectSummary}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Informações adicionais</p>
            <p className={projectInfoValueClass}>{extensionForm.additionalInformation || '-'}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Confirmações marcadas</p>
            <p className={projectInfoValueClass}>
              {acknowledgementOptions.filter((item) =>
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
      {notice && <p className={successTextClass}>{notice}</p>}

      {!isLoading && project && (
        <div className={projectTwoCardsClass}>
          <section className={projectMainCardClass}>
            <div className={projectDetailClass}>
              <div className={projectCardTopClass}>
                <h1>{project.title}</h1>
              </div>

              <div className={projectApprovalChipClass}>
                <p className={projectApprovalLabelClass}>Status de aprovação</p>
                <p className={projectApprovalValueClass}>{approvalStatusLabel}</p>
                <p className={projectApprovalDateClass}>{formatTimelineDate(approvalStatusDate)}</p>
              </div>

              <section className={projectInfoGridClass}>
                {project.tipo === 'extensao' ? (
                  <div className={projectInfoItemFullClass}>
                    {renderExtensionSummary(createExtensionPlanFromProject(project))}
                  </div>
                ) : (
                  <div className={projectSectionsStackClass}>
                    <section className={projectInfoGridClass}>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Docente</p>
                      <p className={projectInfoValueClass}>{project.professor}</p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Título da Iniciativa</p>
                      <p className={projectInfoValueClass}>{project.title}</p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Programa Unicap</p>
                      <p className={projectInfoValueClass}>{project.discipline}</p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Nome da Disciplina</p>
                      <p className={projectInfoValueClass}>{project.target_audience}</p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Curso Vinculado</p>
                      <p className={projectInfoValueClass}>
                        {project.course || disciplineExtensionForm?.linkedCourse || '-'}
                      </p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Período de realização da disciplina</p>
                      <p className={projectInfoValueClass}>{project.semestre_letivo || '-'}</p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Carga horária de Extensão</p>
                      <p className={projectInfoValueClass}>{Number(project.budget).toFixed(0)}h</p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Código da Extensão</p>
                      <p className={projectInfoValueClass}>{disciplineMetadata?.codigoExtensao || '-'}</p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Código da Disciplina</p>
                      <p className={projectInfoValueClass}>
                        {disciplineMetadata?.codigoDisciplina || '-'}
                      </p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Código da Turma</p>
                      <p className={projectInfoValueClass}>{disciplineMetadata?.codigoTurma || '-'}</p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Disciplina Gerencial</p>
                      <p className={projectInfoValueClass}>
                        {disciplineMetadata
                          ? disciplineManagerialLabel(disciplineMetadata.disciplinaGerencial)
                          : '-'}
                      </p>
                    </div>
                    <div className={projectInfoItemFullClass}>
                      <p className={projectInfoLabelClass}>Cursos Gerenciados</p>
                      <p className={projectInfoValueClass}>
                        {disciplineMetadata?.cursosGerenciados || '-'}
                      </p>
                    </div>
                    <div className={projectInfoItemClass}>
                      <p className={projectInfoLabelClass}>Datas no sistema</p>
                      <p className={projectInfoValueClass}>
                        {project.period_start} ate {project.period_end}
                      </p>
                    </div>
                    </section>
                    {project.extension_form &&
                      renderExtensionSummary(
                        createExtensionPlanFromProject(project),
                        DISCIPLINE_ACKNOWLEDGEMENT_OPTIONS,
                        'axes-only',
                      )}
                  </div>
                )}
              </section>

              <label className={formLabelClass}>
                Mensagem ao docente
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
                  onClick={() => handleDecision(approveDecision)}
                  disabled={isDeciding}
                >
                  {isDeciding ? 'Processando...' : approveLabel}
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
                  onClick={() => handleDecision(rejectDecision)}
                  disabled={isDeciding}
                >
                  {isDeciding ? 'Processando...' : rejectLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGeneratePdf}
                  disabled={isGeneratingPdf || isDeciding}
                  className="ml-auto"
                >
                  {isGeneratingPdf ? <Spinner size="sm" /> : <FileText size={14} />}
                  <span>{isGeneratingPdf ? 'Gerando PDF...' : 'Gerar PDF'}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteOpen(true)}
                  disabled={isDeciding || isDeleting}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={14} />
                  <span>Excluir projeto</span>
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
              const highlightText =
                step.key === 'analysis'
                  ? analysisHighlight
                  : step.key === 'approval_status'
                    ? decisionHighlight
                    : null

              return (
                <div key={step.key}>
                  <p className={rowClass}>
                    <strong>{step.label}:</strong>{' '}
                    {step.key === 'approval_status'
                      ? `${approvalStatusLabel}${step.date ? ` (${formatTimelineDate(step.date)})` : ''}`
                      : formatTimelineDate(step.date)}
                  </p>
                  {highlightText && (
                    <p className="mt-1.5! ml-2 inline-flex max-w-full items-center rounded-full bg-accent/60 px-2.5 py-0.5 text-[0.8rem]! font-semibold text-foreground!">
                      {highlightText}
                    </p>
                  )}
                </div>
              )
            })}
          </aside>
        </div>
      )}

      {isDeleteOpen && project && (
        <div
          className={confirmModalBackdropClass}
          onClick={() => {
            if (!isDeleting) closeDelete()
          }}
        >
          <div className={confirmModalClass} onClick={(e) => e.stopPropagation()}>
            <h2>Excluir projeto?</h2>
            <p>
              Vai marcar <strong>{project.title}</strong> como excluido. O projeto some das listas
              e o docente não consegue ver mais. Esta ação não pode ser desfeita pelo painel.
            </p>
            <label className="mt-3 flex flex-col gap-1.5">
              <span className="text-[0.85rem] text-muted-foreground">
                Para confirmar, digite: <code className="font-bold">EXCLUIR</code>
              </span>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                disabled={isDeleting}
                autoFocus
              />
            </label>
            <div className={confirmModalActionsClass}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={closeDelete}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void handleDelete()}
                disabled={isDeleting || deleteConfirmText !== 'EXCLUIR'}
              >
                {isDeleting && <Spinner size="sm" />}
                <span>Excluir</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
