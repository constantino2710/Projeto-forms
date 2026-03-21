import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { sendProjectStatusEmail } from '../../features/notifications/projectEmails'
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
        setProject(data)
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

  return (
    <article className="dashboard-panel">
      <Link to="/admin/projetos" className="back-link">
        <ArrowLeft size={14} />
        <span>Voltar para projetos</span>
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

          <p>Professor: {project.professor}</p>
          <p>Disciplina: {project.discipline}</p>
          <p>Curso: {project.course}</p>
          <p>
            Periodo: {project.period_start} ate {project.period_end}
          </p>
          <p>Publico-alvo: {project.target_audience}</p>
          <p>Orcamento: R$ {Number(project.budget).toFixed(2)}</p>
          <p>Descricao: {project.description}</p>

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
      )}
    </article>
  )
}
