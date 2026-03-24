import { ArrowLeft } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
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
  type UserProject,
} from "../../features/projects/userProjects";

type EditFormState = {
  title: string;
  thematicArea: string;
  course: string;
  periodStart: string;
  periodEnd: string;
  targetAudience: string;
  budget: string;
  description: string;
};

export function UserProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<UserProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setProject(data);
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
    setEditForm({
      title: project.title,
      thematicArea: project.thematic_area,
      course: project.course ?? "",
      periodStart: project.period_start,
      periodEnd: project.period_end,
      targetAudience: project.target_audience,
      budget: String(project.budget),
      description: project.description ?? "",
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

    try {
      await updateMyProjectDetails({
        projectId: project.id,
        title: editForm.title,
        thematicArea: editForm.thematicArea,
        course: editForm.course,
        periodStart: editForm.periodStart,
        periodEnd: editForm.periodEnd,
        targetAudience: editForm.targetAudience,
        budget: Number(editForm.budget || 0),
        description: editForm.description,
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

    if (
      !window.confirm(
        "Tem certeza que deseja excluir este rascunho? Esta ação não pode ser desfeita.",
      )
    ) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      await deleteMyProject(project.id);
      navigate("/usuario/meus-projetos");
    } catch (err) {
      const nextError =
        err instanceof Error ? err.message : "Falha ao excluir rascunho.";
      setError(nextError);
      setIsDeleting(false);
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
    <article className="dashboard-panel">
      <Link to="/usuario/meus-projetos" className="back-link">
        <ArrowLeft size={14} />
        <span>Voltar para meus projetos</span>
      </Link>

      {isLoading && <p className="dashboard-note">Carregando projeto...</p>}
      {error && <p className="error">{error}</p>}

      {!isLoading && project && (
        <div className="project-detail">
          <div className="project-card-top">
            <h1>{project.title}</h1>
            <span className={`status-badge status-${project.status}`}>
              {projectStatusLabel[project.status]}
            </span>
          </div>

          {!isEditing ? (
            <>
              <p>Area: {project.thematic_area}</p>
              <p>Curso: {project.course || "-"}</p>
              <p>
                Periodo: {project.period_start} ate {project.period_end}
              </p>
              <p>Publico-alvo: {project.target_audience}</p>
              <p>Orcamento: R$ {Number(project.budget).toFixed(2)}</p>
              <p>Descricao: {project.description}</p>
              {project.admin_message && (
                <p>Mensagem da avaliacao: {project.admin_message}</p>
              )}

              <div className="project-detail-actions">
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
                {project.status === "rascunho" && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteProject}
                    disabled={isDeleting || isSubmitting}
                  >
                    {isDeleting ? "Excluindo..." : "Excluir rascunho"}
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
                    {isSubmitting
                      ? "Atualizando..."
                      : project.status === "submetido"
                        ? "Voltar para rascunho"
                        : project.status === "em_ajustes"
                          ? "Reenviar para avaliacao"
                          : "Submeter"}
                  </Button>
                )}
              </div>

              <section className="attachments-panel">
                <div className="attachments-header">
                  <h2>Anexos</h2>
                  <label className="attachments-upload">
                    <Input
                      type="file"
                      onChange={handleUploadAttachment}
                      disabled={isUploadingAttachment}
                    />
                  </label>
                </div>

                <p className="dashboard-note">
                  Envie arquivos de apoio (PDF, imagens, DOC, XLS, PPT) ate 20
                  MB.
                </p>

                {isAttachmentsLoading && (
                  <p className="dashboard-note">Carregando anexos...</p>
                )}
                {attachmentError && <p className="error">{attachmentError}</p>}

                {!isAttachmentsLoading && attachments.length === 0 && (
                  <p className="dashboard-note">Nenhum anexo enviado.</p>
                )}

                {!isAttachmentsLoading && attachments.length > 0 && (
                  <ul className="attachments-list">
                    {attachments.map((attachment) => (
                      <li key={attachment.id} className="attachment-item">
                        <div>
                          <p className="attachment-name">
                            {attachment.file_name}
                          </p>
                          <p className="attachment-meta">
                            {formatAttachmentSize(attachment.size_bytes)} -{" "}
                            {new Date(attachment.created_at).toLocaleString(
                              "pt-BR",
                            )}
                          </p>
                        </div>
                        <div className="attachment-actions">
                          {attachment.download_url && (
                            <a
                              href={attachment.download_url}
                              target="_blank"
                              rel="noreferrer"
                              className="attachment-link"
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
                            {deletingAttachmentId === attachment.id
                              ? "Excluindo..."
                              : "Excluir"}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : (
            <form className="project-form" onSubmit={handleSaveEdit}>
              <label>
                Titulo
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

              <label>
                Area tematica
                <Input
                  value={editForm?.thematicArea ?? ""}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev
                        ? { ...prev, thematicArea: event.target.value }
                        : prev,
                    )
                  }
                  required
                />
              </label>

              <label>
                Curso
                <Input
                  value={editForm?.course ?? ""}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, course: event.target.value } : prev,
                    )
                  }
                />
              </label>

              <div className="project-grid-2">
                <label>
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
                <label>
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

              <label>
                Publico-alvo
                <Input
                  value={editForm?.targetAudience ?? ""}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev
                        ? { ...prev, targetAudience: event.target.value }
                        : prev,
                    )
                  }
                  required
                />
              </label>

              <label>
                Orcamento
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editForm?.budget ?? ""}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, budget: event.target.value } : prev,
                    )
                  }
                  required
                />
              </label>

              <label>
                Descricao
                <Textarea
                  value={editForm?.description ?? ""}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev
                        ? { ...prev, description: event.target.value }
                        : prev,
                    )
                  }
                  rows={6}
                  required
                />
              </label>

              <div className="project-inline-actions">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
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
      )}
    </article>
  );
}
