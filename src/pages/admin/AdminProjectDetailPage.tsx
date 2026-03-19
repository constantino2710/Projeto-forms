import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import {
  decideAdminProject,
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

  const handleDecision = async (decision: 'aprovado' | 'reprovado') => {
    if (!projectId) {
      return
    }

    setError('')
    setIsDeciding(true)

    try {
      await decideAdminProject(projectId, decision)
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

          <div className="project-detail-actions">
            <Button
              type="button"
              size="sm"
              onClick={() => handleDecision('aprovado')}
              disabled={isDeciding}
            >
              {isDeciding ? 'Processando...' : 'Aceitar'}
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
