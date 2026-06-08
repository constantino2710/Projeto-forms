import { ArrowLeft, Trash2 } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ExtensionProjectFields } from "../../components/projects/ExtensionProjectFields";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Spinner } from "../../components/ui/spinner";
import {
  buildDisciplineExtensionForm,
  buildDisciplineMetadataDescription,
  disciplineManagerialLabel,
  parseDisciplineMetadataDescription,
  type DisciplineManagerialOption,
} from "../../features/disciplines/disciplineProjectMetadata";
import {
  ACKNOWLEDGEMENT_OPTIONS,
  areAcknowledgementsComplete,
  createExtensionPlanFromProject,
  DISCIPLINE_ACKNOWLEDGEMENT_OPTIONS,
  UNICAP_PROGRAM_OPTIONS,
  isExtensionPlanComplete,
  type ExtensionPlanData,
} from "../../features/projects/extensionPlan";
import {
  deleteProjectAttachment,
  listProjectAttachments,
  type ProjectAttachment,
  uploadProjectAttachment,
} from "../../features/projects/projectAttachments";
import {
  getMyProjectDetail,
  projectStatusLabel,
  updateMyProjectDetails,
  updateMyProjectStatus,
  deleteMyProject,
  duplicateMyProject,
  type UserProject,
} from "../../features/projects/userProjects";
import {
  getProjectTimeline,
  type ProjectTimeline,
} from "../../features/projects/projectTimeline";
import { projectFormLabelClass } from "../../lib/formStyles";
import {
  attachmentActionsClass,
  attachmentItemClass,
  attachmentLinkClass,
  attachmentMetaClass,
  attachmentNameClass,
  attachmentsHeaderClass,
  attachmentsListClass,
  attachmentsPanelClass,
  attachmentsUploadClass,
  backLinkClass,
  confirmModalActionsClass,
  confirmModalBackdropClass,
  confirmModalClass,
  dashboardNoteClass,
  dashboardPanelFlatClass,
  draftDeleteIconBtnClass,
  errorTextClass,
  projectCardTopClass,
  projectDetailActionsLeftClass,
  projectDetailActionsSpreadClass,
  projectDetailClass,
  projectFeedbackNoteClass,
  projectFormClass,
  projectGrid2Class,
  projectInfoGridClass,
  projectInfoItemClass,
  projectInfoItemFullClass,
  projectInfoLabelClass,
  projectInfoSectionClass,
  projectInfoValueClass,
  projectInlineActionsClass,
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
} from "../../lib/projectStyles";
import { cn } from "../../lib/utils";

type EditFormState = {
  type: "extensao" | "disciplina";
  title: string;
  thematicArea: string;
  course: string;
  periodStart: string;
  periodEnd: string;
  budget: string;
  disciplineName: string;
  codigoExtensao: string;
  codigoDisciplina: string;
  codigoTurma: string;
  disciplinaGerencial: DisciplineManagerialOption;
  managedCourses: string;
  semestreLetivo: string;
  extensionForm: ExtensionPlanData;
};

const DISCIPLINE_MANAGERIAL_OPTIONS: DisciplineManagerialOption[] = ["Sim", "Nao"];

export function UserProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<UserProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [attachments, setAttachments] = useState<ProjectAttachment[]>([]);
  const [isAttachmentsLoading, setIsAttachmentsLoading] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [timeline, setTimeline] = useState<ProjectTimeline | null>(null);

  const loadProject = async () => {
    if (!projectId) {
      setError("Projeto invalido.");
      setIsLoading(false);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const data = await getMyProjectDetail(projectId);
      const timelineData = await getProjectTimeline(projectId);
      setProject(data);
      setTimeline(timelineData);
    } catch (err) {
      const nextError =
        err instanceof Error ? err.message : "Falha ao carregar projeto.";
      setError(nextError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadAttachments = async () => {
    if (!projectId) {
      return;
    }

    setAttachmentError("");
    setIsAttachmentsLoading(true);

    try {
      const data = await listProjectAttachments(projectId);
      setAttachments(data);
    } catch (err) {
      const nextError =
        err instanceof Error ? err.message : "Falha ao carregar anexos.";
      setAttachmentError(nextError);
    } finally {
      setIsAttachmentsLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [projectId]);

  const startEdit = () => {
    if (
      !project ||
      (project.status !== "rascunho" && project.status !== "em_ajustes")
    ) {
      return;
    }

    setIsEditing(true);
    const disciplineMetadata = parseDisciplineMetadataDescription(project.description);
    const disciplineExtensionForm = createExtensionPlanFromProject(project);
    setEditForm({
      type: project.tipo,
      title: project.title,
      thematicArea: project.thematic_area,
      course: project.course ?? disciplineExtensionForm.linkedCourse ?? "",
      periodStart: project.period_start,
      periodEnd: project.period_end,
      budget: String(project.budget),
      disciplineName: project.target_audience,
      codigoExtensao: disciplineMetadata.codigoExtensao,
      codigoDisciplina: project.codigo_disciplina ?? disciplineMetadata.codigoDisciplina,
      codigoTurma: disciplineMetadata.codigoTurma,
      disciplinaGerencial: disciplineMetadata.disciplinaGerencial,
      managedCourses: disciplineMetadata.cursosGerenciados,
      semestreLetivo: project.semestre_letivo ?? "",
      extensionForm: disciplineExtensionForm,
    });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project || !editForm) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    const hasRequiredAcknowledgements =
      editForm.type === "extensao"
        ? isExtensionPlanComplete(editForm.extensionForm)
        : areAcknowledgementsComplete(
            editForm.extensionForm.acknowledgements,
            DISCIPLINE_ACKNOWLEDGEMENT_OPTIONS,
          )

    if (!hasRequiredAcknowledgements) {
      setError("Marque todos os itens de confirmacao da conclusao para continuar.");
      setIsSubmitting(false);
      return;
    }

    try {
      await updateMyProjectDetails({
        projectId: project.id,
        title: editForm.type === "extensao" ? editForm.extensionForm.title : editForm.title,
        thematicArea:
          editForm.type === "extensao"
            ? editForm.extensionForm.unicapProgram
            : editForm.thematicArea,
        course: null,
        periodStart:
          editForm.type === "extensao"
            ? editForm.extensionForm.periodStart
            : editForm.periodStart,
        periodEnd:
          editForm.type === "extensao" ? editForm.extensionForm.periodEnd : editForm.periodEnd,
        targetAudience:
          editForm.type === "extensao"
            ? editForm.extensionForm.targetAudience
            : editForm.disciplineName,
        budget: editForm.type === "extensao" ? 0 : Number(editForm.budget || 0),
        description:
          editForm.type === "extensao"
            ? editForm.extensionForm.projectSummary
            : buildDisciplineMetadataDescription({
                codigoExtensao: editForm.codigoExtensao,
                codigoDisciplina: editForm.codigoDisciplina,
                codigoTurma: editForm.codigoTurma,
                disciplinaGerencial: editForm.disciplinaGerencial,
                cursosGerenciados: editForm.managedCourses,
              }),
        type: editForm.type,
        codigoDisciplina: editForm.type === "disciplina" ? editForm.codigoDisciplina : null,
        semestreLetivo: editForm.type === "disciplina" ? editForm.semestreLetivo : null,
        extensionForm:
          editForm.type === "extensao"
            ? editForm.extensionForm
            : buildDisciplineExtensionForm(editForm, editForm.extensionForm),
      });

      cancelEdit();
      await loadProject();
    } catch (err) {
      const nextError =
        err instanceof Error ? err.message : "Falha ao salvar alteracoes.";
      setError(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async () => {
    if (
      !project ||
      (project.status !== "rascunho" &&
        project.status !== "submetido" &&
        project.status !== "em_ajustes")
    ) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const nextStatus =
        project.status === "submetido" ? "rascunho" : "submetido";
      await updateMyProjectStatus(project.id, nextStatus);
      await loadProject();
    } catch (err) {
      const nextError =
        err instanceof Error ? err.message : "Falha ao atualizar status.";
      setError(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project || project.status !== "rascunho") {
      return;
    }
    setError("");
    setIsDeleting(true);

    try {
      await deleteMyProject(project.id);
      setIsDeleteModalOpen(false);
      navigate("/usuario/meus-projetos");
    } catch (err) {
      const nextError =
        err instanceof Error ? err.message : "Falha ao excluir rascunho.";
      setError(nextError);
      setIsDeleting(false);
    }
  };

  const handleDuplicateProject = async () => {
    if (!project) {
      return;
    }

    setError("");
    setIsDuplicating(true);

    try {
      const result = await duplicateMyProject(project);
      navigate(`/usuario/meus-projetos/${result.id}`);
    } catch (err) {
      const nextError =
        err instanceof Error ? err.message : "Falha ao duplicar projeto.";
      setError(nextError);
    } finally {
      setIsDuplicating(false);
    }
  };

  const formatAttachmentSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimelineDate = (value: string | null) => {
    if (!value) {
      return "Aguardando";
    }
    return new Date(value).toLocaleString("pt-BR");
  };

  const approvalStatusDate =
    project?.status === "aprovado"
      ? timeline?.approved_at ?? null
      : project?.status === "reprovado"
        ? timeline?.rejected_at ?? null
        : project?.status === "pre_aprovado" || project?.status === "pre_reprovado"
          ? timeline?.reviewed_at ?? null
          : null;
  const timelineSteps = [
    { key: "created", label: "Criado", date: timeline?.created_at ?? null },
    { key: "submitted", label: "Submetido", date: timeline?.submitted_at ?? null },
    {
      key: "analysis",
      label: "Em analise",
      date: timeline?.analysis_started_at ?? null,
    },
    {
      key: "approval_status",
      label: "Status da aprovacao",
      date: approvalStatusDate,
    },
  ];
  const approvalStatusLabel =
    project?.status === "aprovado"
      ? "Aprovado"
      : project?.status === "reprovado"
        ? "Recusado"
        : project?.status === "pre_aprovado"
          ? "Pre-aprovado"
          : project?.status === "pre_reprovado"
            ? "Pre-reprovado"
            : "Pendente";
  const disciplineMetadata = project?.tipo === "disciplina"
    ? parseDisciplineMetadataDescription(project.description)
    : null;
  const disciplineExtensionForm =
    project?.tipo === "disciplina" && project.extension_form
      ? createExtensionPlanFromProject(project)
      : null
  const latestTimelineIndex = timelineSteps.reduce(
    (latest, step, index) => (step.date ? index : latest),
    -1,
  );

  const handleUploadAttachment = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) {
      return;
    }

    setAttachmentError("");
    setIsUploadingAttachment(true);
    try {
      await uploadProjectAttachment(projectId, file);
      await loadAttachments();
    } catch (err) {
      const nextError =
        err instanceof Error ? err.message : "Falha ao enviar anexo.";
      setAttachmentError(nextError);
    } finally {
      setIsUploadingAttachment(false);
      event.target.value = "";
    }
  };

  const renderExtensionSummary = (
    extensionForm: ExtensionPlanData,
    acknowledgementOptions: readonly { id: string; label: string }[] = ACKNOWLEDGEMENT_OPTIONS,
    mode: "full" | "axes-only" = "full",
  ) => (
    <div className={projectSectionsStackClass}>
      {mode === "full" && (
        <>
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
              <div className={projectInfoItemClass}>
                <p className={projectInfoLabelClass}>E-mail da Coordenacao</p>
                <p className={projectInfoValueClass}>{extensionForm.coordinationEmail}</p>
              </div>
            </div>
          </section>

          <section className={projectInfoSectionClass}>
            <h3>Docentes</h3>
            <div className={projectInfoGridClass}>
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
                <p className={projectInfoLabelClass}>Carga Horaria Semanal - Coordenador</p>
                <p className={projectInfoValueClass}>{extensionForm.coordinatorWeeklyHours}</p>
              </div>
              <div className={projectInfoItemFullClass}>
                <p className={projectInfoLabelClass}>Forma de participacao do Coordenador</p>
                <p className={projectInfoValueClass}>{extensionForm.coordinatorParticipation}</p>
              </div>
              <div className={projectInfoItemFullClass}>
                <p className={projectInfoLabelClass}>Outros docentes colaboradores voluntarios</p>
                <p className={projectInfoValueClass}>{extensionForm.otherVolunteerTeachers || "-"}</p>
              </div>
            </div>
          </section>

          <section className={projectInfoSectionClass}>
            <h3>Estudantes voluntarios</h3>
            <div className={projectInfoGridClass}>
              <div className={projectInfoItemClass}>
                <p className={projectInfoLabelClass}>Carga Horaria Semanal - Estudantes</p>
                <p className={projectInfoValueClass}>{extensionForm.studentWeeklyHours}</p>
              </div>
              <div className={projectInfoItemFullClass}>
                <p className={projectInfoLabelClass}>Estudantes participantes</p>
                <p className={projectInfoValueClass}>{extensionForm.studentParticipants}</p>
              </div>
            </div>
          </section>
        </>
      )}

      <section className={projectInfoSectionClass}>
        <h3>Eixo Aprendizagem</h3>
        <div className={projectInfoGridClass}>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Objetivos de Aprendizagem</p>
            <p className={projectInfoValueClass}>{extensionForm.learningObjectives.filter(Boolean).join(" | ")}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Competencias Transversais</p>
            <p className={projectInfoValueClass}>
              {extensionForm.transversalCompetencies.filter(Boolean).join(" | ")}
            </p>
          </div>
        </div>
      </section>

      <section className={projectInfoSectionClass}>
        <h3>Eixo Servico</h3>
        <div className={projectInfoGridClass}>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Servico a ser oferecido</p>
            <p className={projectInfoValueClass}>{extensionForm.serviceOffered}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Atividades</p>
            <p className={projectInfoValueClass}>{extensionForm.activities.filter(Boolean).join(" | ")}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Local de realizacao</p>
            <p className={projectInfoValueClass}>{extensionForm.executionLocation}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Publico que sera atendido</p>
            <p className={projectInfoValueClass}>{extensionForm.targetAudience}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Procedimentos Metodologicos</p>
            <p className={projectInfoValueClass}>{extensionForm.methodologicalProcedures}</p>
          </div>
        </div>
      </section>

      <section className={projectInfoSectionClass}>
        <h3>Eixo Impacto</h3>
        <div className={projectInfoGridClass}>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Problema ou Necessidade a ser respondido</p>
            <p className={projectInfoValueClass}>{extensionForm.problemStatement}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>ODS Impactado</p>
            <p className={projectInfoValueClass}>{extensionForm.sustainableDevelopmentGoal}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Metas</p>
            <p className={projectInfoValueClass}>{extensionForm.goals.filter(Boolean).join(" | ")}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Estrategias de Divulgacao</p>
            <p className={projectInfoValueClass}>{extensionForm.disseminationStrategies}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Resumo do projeto</p>
            <p className={projectInfoValueClass}>{extensionForm.projectSummary}</p>
          </div>
        </div>
      </section>

      <section className={projectInfoSectionClass}>
        <h3>Eixo Reflexao e Avaliacao</h3>
        <div className={projectInfoGridClass}>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Estrategias de Reflexao</p>
            <p className={projectInfoValueClass}>{extensionForm.reflectionStrategies}</p>
          </div>
          <div className={projectInfoItemClass}>
            <p className={projectInfoLabelClass}>Estrategias de Avaliacao</p>
            <p className={projectInfoValueClass}>{extensionForm.evaluationStrategies}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Feedback do Publico Parceiro</p>
            <p className={projectInfoValueClass}>{extensionForm.partnerFeedback}</p>
          </div>
        </div>
      </section>

      <section className={projectInfoSectionClass}>
        <h3>Conclusao</h3>
        <div className={projectInfoGridClass}>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Informacoes Adicionais</p>
            <p className={projectInfoValueClass}>{extensionForm.additionalInformation || "-"}</p>
          </div>
          <div className={projectInfoItemFullClass}>
            <p className={projectInfoLabelClass}>Compreendi que...</p>
            <p className={projectInfoValueClass}>
              {acknowledgementOptions.filter((item) =>
                extensionForm.acknowledgements.includes(item.id),
              )
                .map((item) => item.label)
                .join(" | ")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!projectId) {
      return;
    }

    setAttachmentError("");
    setDeletingAttachmentId(attachmentId);
    try {
      await deleteProjectAttachment(projectId, attachmentId);
      await loadAttachments();
    } catch (err) {
      const nextError =
        err instanceof Error ? err.message : "Falha ao excluir anexo.";
      setAttachmentError(nextError);
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  return (
    <article className={dashboardPanelFlatClass}>
      <Link to="/usuario/meus-projetos" className={backLinkClass}>
        <ArrowLeft size={14} />
        <span>Voltar para meus projetos</span>
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

              {!isEditing ? (
                <>
                  {project.tipo === "extensao" ? (
                    renderExtensionSummary(createExtensionPlanFromProject(project))
                  ) : (
                    <div className={projectSectionsStackClass}>
                      <section className={projectInfoGridClass}>
                        <div className={projectInfoItemClass}>
                          <p className={projectInfoLabelClass}>Titulo da Iniciativa</p>
                          <p className={projectInfoValueClass}>{project.title}</p>
                        </div>
                        <div className={projectInfoItemClass}>
                          <p className={projectInfoLabelClass}>Programa Unicap</p>
                          <p className={projectInfoValueClass}>{project.thematic_area}</p>
                        </div>
                        <div className={projectInfoItemClass}>
                          <p className={projectInfoLabelClass}>Nome da Disciplina</p>
                          <p className={projectInfoValueClass}>{project.target_audience}</p>
                        </div>
                        <div className={projectInfoItemClass}>
                          <p className={projectInfoLabelClass}>Curso Vinculado</p>
                          <p className={projectInfoValueClass}>
                            {project.course || disciplineExtensionForm?.linkedCourse || "-"}
                          </p>
                        </div>
                        <div className={projectInfoItemClass}>
                          <p className={projectInfoLabelClass}>Periodo de realizacao da disciplina</p>
                          <p className={projectInfoValueClass}>{project.semestre_letivo || "-"}</p>
                        </div>
                        <div className={projectInfoItemClass}>
                          <p className={projectInfoLabelClass}>Carga horaria de Extensao</p>
                          <p className={projectInfoValueClass}>{Number(project.budget).toFixed(0)}h</p>
                        </div>
                        <div className={projectInfoItemClass}>
                          <p className={projectInfoLabelClass}>Codigo Extensao</p>
                          <p className={projectInfoValueClass}>{disciplineMetadata?.codigoExtensao || "-"}</p>
                        </div>
                        <div className={projectInfoItemClass}>
                          <p className={projectInfoLabelClass}>Codigo da Disciplina</p>
                          <p className={projectInfoValueClass}>
                            {project.codigo_disciplina || disciplineMetadata?.codigoDisciplina || "-"}
                          </p>
                        </div>
                        <div className={projectInfoItemClass}>
                          <p className={projectInfoLabelClass}>Codigo da Turma</p>
                          <p className={projectInfoValueClass}>{disciplineMetadata?.codigoTurma || "-"}</p>
                        </div>
                        <div className={projectInfoItemClass}>
                          <p className={projectInfoLabelClass}>Disciplina Gerencial</p>
                          <p className={projectInfoValueClass}>
                            {disciplineMetadata
                              ? disciplineManagerialLabel(disciplineMetadata.disciplinaGerencial)
                              : "-"}
                          </p>
                        </div>
                        <div className={projectInfoItemFullClass}>
                          <p className={projectInfoLabelClass}>Cursos Gerenciados</p>
                          <p className={projectInfoValueClass}>
                            {disciplineMetadata?.cursosGerenciados || "-"}
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
                          "axes-only",
                        )}
                    </div>
                  )}
                  {project.admin_message && (
                    <div className={projectFeedbackNoteClass}>
                      <p className={projectInfoLabelClass}>Mensagem da avaliacao</p>
                      <p className={projectInfoValueClass}>{project.admin_message}</p>
                    </div>
                  )}

                  <div className={projectDetailActionsSpreadClass}>
                    <div className={projectDetailActionsLeftClass}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDuplicateProject}
                      disabled={isDuplicating || isSubmitting || isDeleting}
                    >
                      {isDuplicating && <Spinner size="sm" />}
                      <span>Duplicar</span>
                    </Button>
                    {(project.status === "rascunho" ||
                      project.status === "em_ajustes") && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startEdit}
                      >
                        Editar
                      </Button>
                    )}
                      {(project.status === "rascunho" ||
                        project.status === "submetido" ||
                        project.status === "em_ajustes") && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleStatusToggle}
                          disabled={isSubmitting || isDeleting}
                        >
                          {isSubmitting && <Spinner size="sm" />}
                          <span>
                            {project.status === "submetido"
                              ? "Voltar para rascunho"
                              : project.status === "em_ajustes"
                                ? "Reenviar para avaliacao"
                                : "Submeter"}
                          </span>
                        </Button>
                      )}
                    </div>
                    {project.status === "rascunho" && (
                      <button
                        type="button"
                        className={draftDeleteIconBtnClass}
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={isDeleting || isSubmitting}
                        aria-label="Excluir rascunho"
                        title="Excluir rascunho"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <section className={attachmentsPanelClass}>
                    <div className={attachmentsHeaderClass}>
                      <h2>Anexos</h2>
                      <label className={attachmentsUploadClass}>
                        <Input
                          type="file"
                          onChange={handleUploadAttachment}
                          disabled={isUploadingAttachment}
                        />
                      </label>
                    </div>

                    <p className={dashboardNoteClass}>
                      Envie arquivos de apoio (PDF, imagens, DOC, XLS, PPT) ate 20
                      MB.
                    </p>

                    {isAttachmentsLoading && (
                      <div className="mt-2 flex justify-center text-muted-foreground">
                        <Spinner size="sm" />
                      </div>
                    )}
                    {attachmentError && <p className={errorTextClass}>{attachmentError}</p>}

                    {!isAttachmentsLoading && attachments.length === 0 && (
                      <p className={dashboardNoteClass}>Nenhum anexo enviado.</p>
                    )}

                    {!isAttachmentsLoading && attachments.length > 0 && (
                      <ul className={attachmentsListClass}>
                        {attachments.map((attachment) => (
                          <li key={attachment.id} className={attachmentItemClass}>
                            <div>
                              <p className={attachmentNameClass}>
                                {attachment.file_name}
                              </p>
                              <p className={attachmentMetaClass}>
                                {formatAttachmentSize(attachment.size_bytes)} -{" "}
                                {new Date(attachment.created_at).toLocaleString(
                                  "pt-BR",
                                )}
                              </p>
                            </div>
                            <div className={attachmentActionsClass}>
                              {attachment.download_url && (
                                <a
                                  href={attachment.download_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={attachmentLinkClass}
                                >
                                  Baixar
                                </a>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeleteAttachment(attachment.id)
                                }
                                disabled={deletingAttachmentId === attachment.id}
                              >
                                {deletingAttachmentId === attachment.id && (
                                  <Spinner size="sm" />
                                )}
                                <span>Excluir</span>
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              ) : (
                <form className={projectFormClass} onSubmit={handleSaveEdit}>
                  {editForm?.type === "extensao" ? (
                    <ExtensionProjectFields
                      form={editForm.extensionForm}
                      onChange={(nextForm) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, extensionForm: nextForm } : prev,
                        )
                      }
                      disabled={isSubmitting}
                      />
                  ) : (
                    <>
                      <label className={projectFormLabelClass}>
                        Titulo da Iniciativa
                        <Input
                          value={editForm?.title ?? ""}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, title: event.target.value } : prev,
                            )
                          }
                          required
                        />
                      </label>

                      <label className={projectFormLabelClass}>
                        Programa Unicap
                        <select
                          className="ui-input ui-select"
                          value={editForm?.thematicArea ?? ""}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev
                                ? { ...prev, thematicArea: event.target.value }
                                : prev,
                            )
                          }
                          required
                        >
                          <option value="">Selecione</option>
                          {UNICAP_PROGRAM_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className={projectFormLabelClass}>
                        Nome da Disciplina
                        <Input
                          value={editForm?.disciplineName ?? ""}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev
                                ? { ...prev, disciplineName: event.target.value }
                                : prev,
                            )
                          }
                          required
                        />
                      </label>

                      <div className={projectGrid2Class}>
                        <label className={projectFormLabelClass}>
                          Codigo Extensao
                          <Input
                            value={editForm?.codigoExtensao ?? ""}
                            onChange={(event) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, codigoExtensao: event.target.value }
                                  : prev,
                              )
                            }
                            required
                          />
                        </label>

                        <label className={projectFormLabelClass}>
                          Codigo da Disciplina
                          <Input
                            value={editForm?.codigoDisciplina ?? ""}
                            onChange={(event) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, codigoDisciplina: event.target.value }
                                  : prev,
                              )
                            }
                            required
                          />
                        </label>
                      </div>

                      <label className={projectFormLabelClass}>
                        Curso em que a disciplina esta vinculada
                        <Input
                          value={editForm?.course ?? ""}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev ? { ...prev, course: event.target.value } : prev,
                            )
                          }
                          required
                        />
                      </label>

                      <div className={projectGrid2Class}>
                        <label className={projectFormLabelClass}>
                          Periodo de realizacao da disciplina
                          <Input
                            value={editForm?.semestreLetivo ?? ""}
                            onChange={(event) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, semestreLetivo: event.target.value }
                                  : prev,
                              )
                            }
                            required
                          />
                        </label>

                        <label className={projectFormLabelClass}>
                          Carga horaria de Extensao
                          <Input
                            type="number"
                            min={0}
                            step="1"
                            value={editForm?.budget ?? ""}
                            onChange={(event) =>
                              setEditForm((prev) =>
                                prev ? { ...prev, budget: event.target.value } : prev,
                              )
                            }
                            required
                          />
                        </label>
                      </div>

                      <ExtensionProjectFields
                        form={editForm!.extensionForm}
                        onChange={(nextForm) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, extensionForm: nextForm } : prev,
                          )
                        }
                        disabled={isSubmitting}
                        mode="axes-only"
                        acknowledgementOptions={DISCIPLINE_ACKNOWLEDGEMENT_OPTIONS}
                      />

                      <div className={projectGrid2Class}>
                        <label className={projectFormLabelClass}>
                          Codigo da Turma
                          <Input
                            value={editForm?.codigoTurma ?? ""}
                            onChange={(event) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, codigoTurma: event.target.value }
                                  : prev,
                              )
                            }
                            required
                          />
                        </label>

                        <label className={projectFormLabelClass}>
                          Disciplina Gerencial
                          <select
                            className="ui-input ui-select"
                            value={editForm?.disciplinaGerencial ?? "Nao"}
                            onChange={(event) =>
                              setEditForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      disciplinaGerencial:
                                        event.target.value as DisciplineManagerialOption,
                                    }
                                  : prev,
                              )
                            }
                            required
                          >
                            {DISCIPLINE_MANAGERIAL_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <label className={projectFormLabelClass}>
                        Cursos Gerenciados
                        <Input
                          value={editForm?.managedCourses ?? ""}
                          onChange={(event) =>
                            setEditForm((prev) =>
                              prev
                                ? { ...prev, managedCourses: event.target.value }
                                : prev,
                            )
                          }
                          placeholder="Preencha quando a disciplina for gerencial"
                        />
                      </label>

                      <div className={projectGrid2Class}>
                        <label className={projectFormLabelClass}>
                          Inicio
                          <Input
                            type="date"
                            value={editForm?.periodStart ?? ""}
                            onChange={(event) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, periodStart: event.target.value }
                                  : prev,
                              )
                            }
                            required
                          />
                        </label>
                        <label className={projectFormLabelClass}>
                          Fim
                          <Input
                            type="date"
                            value={editForm?.periodEnd ?? ""}
                            onChange={(event) =>
                              setEditForm((prev) =>
                                prev
                                  ? { ...prev, periodEnd: event.target.value }
                                  : prev,
                              )
                            }
                            required
                          />
                        </label>
                      </div>
                    </>
                  )}

                  <div className={projectInlineActionsClass}>
                    <Button type="submit" size="sm" disabled={isSubmitting}>
                      {isSubmitting && <Spinner size="sm" />}
                      <span>Salvar alteracoes</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelEdit}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
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
              const isLatest = step.date !== null && index === latestTimelineIndex;
              const rowClass = isLatest
                ? cn(timelineRowClass, timelineRowLatestClass)
                : step.date
                  ? timelineRowClass
                  : cn(timelineRowClass, timelineRowFutureClass);

              return (
                <p key={step.key} className={rowClass}>
                  <strong>{step.label}:</strong>{" "}
                  {step.key === "approval_status"
                    ? `${approvalStatusLabel}${step.date ? ` (${formatTimelineDate(step.date)})` : ""}`
                    : formatTimelineDate(step.date)}
                </p>
              );
            })}
          </aside>
        </div>
      )}
      {isDeleteModalOpen && (
        <div
          className={confirmModalBackdropClass}
          onClick={() => {
            if (!isDeleting) {
              setIsDeleteModalOpen(false);
            }
          }}
        >
          <div
            className={confirmModalClass}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-draft-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-draft-title">Excluir rascunho?</h2>
            <p>
              Este rascunho vai sumir da sua lista, mas os dados ficam salvos
              para recuperacao depois.
            </p>
            <div className={confirmModalActionsClass}>
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
                {isDeleting && <Spinner size="sm" />}
                <span>Confirmar exclusao</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
