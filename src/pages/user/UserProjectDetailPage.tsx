import { ArrowLeft } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import {
  getMyProjectDetail,
  projectStatusLabel,
  updateMyProjectDetails,
  updateMyProjectStatus,
  type UserProject,
} from '../../features/projects/userProjects'

type EditFormState = {
  title: string
  thematicArea: string
  course: string
  periodStart: string
  periodEnd: string
  targetAudience: string
  budget: string
  description: string
}

export function UserProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<UserProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)

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
      setProject(data)
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

  const startEdit = () => {
    if (!project || project.status !== 'rascunho') {
      return
    }

    setIsEditing(true)
    setEditForm({
      title: project.title,
      thematicArea: project.thematic_area,
      course: project.course ?? '',
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
    if (!project || !editForm) {
      return
    }

    setError('')
    setIsSubmitting(true)

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
    if (!project || (project.status !== 'rascunho' && project.status !== 'submetido')) {
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const nextStatus = project.status === 'rascunho' ? 'submetido' : 'rascunho'
      await updateMyProjectStatus(project.id, nextStatus)
      await loadProject()
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao atualizar status.'
      setError(nextError)
    } finally {
      setIsSubmitting(false)
    }
  }

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
              <p>Curso: {project.course || '-'}</p>
              <p>
                Periodo: {project.period_start} ate {project.period_end}
              </p>
              <p>Publico-alvo: {project.target_audience}</p>
              <p>Orcamento: R$ {Number(project.budget).toFixed(2)}</p>
              <p>Descricao: {project.description}</p>

              <div className="project-detail-actions">
                {project.status === 'rascunho' && (
                  <Button type="button" variant="outline" size="sm" onClick={startEdit}>
                    Editar
                  </Button>
                )}
                {(project.status === 'rascunho' || project.status === 'submetido') && (
                  <Button type="button" size="sm" onClick={handleStatusToggle} disabled={isSubmitting}>
                    {isSubmitting
                      ? 'Atualizando...'
                      : project.status === 'rascunho'
                        ? 'Submeter'
                        : 'Voltar para rascunho'}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <form className="project-form" onSubmit={handleSaveEdit}>
              <label>
                Titulo
                <Input
                  value={editForm?.title ?? ''}
                  onChange={(event) =>
                    setEditForm((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                  }
                  required
                />
              </label>

              <label>
                Area tematica
                <Input
                  value={editForm?.thematicArea ?? ''}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, thematicArea: event.target.value } : prev,
                    )
                  }
                  required
                />
              </label>

              <label>
                Curso
                <Input
                  value={editForm?.course ?? ''}
                  onChange={(event) =>
                    setEditForm((prev) => (prev ? { ...prev, course: event.target.value } : prev))
                  }
                />
              </label>

              <div className="project-grid-2">
                <label>
                  Inicio
                  <Input
                    type="date"
                    value={editForm?.periodStart ?? ''}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, periodStart: event.target.value } : prev,
                      )
                    }
                    required
                  />
                </label>
                <label>
                  Fim
                  <Input
                    type="date"
                    value={editForm?.periodEnd ?? ''}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, periodEnd: event.target.value } : prev,
                      )
                    }
                    required
                  />
                </label>
              </div>

              <label>
                Publico-alvo
                <Input
                  value={editForm?.targetAudience ?? ''}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, targetAudience: event.target.value } : prev,
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
                  value={editForm?.budget ?? ''}
                  onChange={(event) =>
                    setEditForm((prev) => (prev ? { ...prev, budget: event.target.value } : prev))
                  }
                  required
                />
              </label>

              <label>
                Descricao
                <Textarea
                  value={editForm?.description ?? ''}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, description: event.target.value } : prev,
                    )
                  }
                  rows={6}
                  required
                />
              </label>

              <div className="project-inline-actions">
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
      )}
    </article>
  )
}
