import { Grid3X3, List } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import {
  listAdminProjectHistory,
  type AdminProjectHistoryCard,
} from '../../features/projects/adminProjects'
import { projectStatusLabel } from '../../features/projects/userProjects'

type ViewMode = 'list' | 'grid'
const VIEW_MODE_KEY = 'admin_history_view_mode'

export function AdminProjectHistoryPage() {
  const [projects, setProjects] = useState<AdminProjectHistoryCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(VIEW_MODE_KEY)
    return stored === 'grid' ? 'grid' : 'list'
  })

  useEffect(() => {
    const load = async () => {
      setError('')
      setIsLoading(true)
      try {
        const data = await listAdminProjectHistory()
        setProjects(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao carregar historico.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const handleSetViewMode = (nextMode: ViewMode) => {
    setViewMode(nextMode)
    localStorage.setItem(VIEW_MODE_KEY, nextMode)
  }

  return (
    <article className="dashboard-panel">
      <div className="projects-header">
        <div>
          <h1>Historico de Projetos</h1>
          <p>Projetos que voce aprovou ou recusou.</p>
        </div>
        <div className="view-toggle">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => handleSetViewMode('list')}
          >
            <List size={14} />
            <span>Lista</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => handleSetViewMode('grid')}
          >
            <Grid3X3 size={14} />
            <span>Grid</span>
          </Button>
        </div>
      </div>

      {isLoading && <p className="dashboard-note">Carregando historico...</p>}
      {error && <p className="error">{error}</p>}
      {!isLoading && projects.length === 0 && (
        <p className="dashboard-note">Nenhum projeto decidido por voce ainda.</p>
      )}

      <div className={viewMode === 'grid' ? 'projects-list projects-grid' : 'projects-list'}>
        {projects.map((project) => (
          <Link key={project.id} to={`/admin/projetos/${project.id}`} className="project-card-link">
            <section className="project-card">
              <div className="project-card-top">
                <h2>{project.title}</h2>
                <span className={`status-badge status-${project.status}`}>
                  {projectStatusLabel[project.status]}
                </span>
              </div>
              <p>Professor: {project.professor}</p>
              <p>Disciplina: {project.discipline}</p>
              <p>Curso: {project.course}</p>
              <p>
                Decidido em:{' '}
                {project.reviewed_at ? new Date(project.reviewed_at).toLocaleString('pt-BR') : '-'}
              </p>
            </section>
          </Link>
        ))}
      </div>
    </article>
  )
}
