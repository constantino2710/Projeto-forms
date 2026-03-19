import { Grid3X3, List } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { listAdminProjects, type AdminProjectCard } from '../../features/projects/adminProjects'
import { projectStatusLabel } from '../../features/projects/userProjects'

type ViewMode = 'list' | 'grid'
const VIEW_MODE_KEY = 'admin_projects_view_mode'

export function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProjectCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(VIEW_MODE_KEY)
    return stored === 'grid' ? 'grid' : 'list'
  })

  const loadProjects = async () => {
    setError('')
    setIsLoading(true)

    try {
      const data = await listAdminProjects()
      setProjects(data)
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao carregar projetos.'
      setError(nextError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleSetViewMode = (nextMode: ViewMode) => {
    setViewMode(nextMode)
    localStorage.setItem(VIEW_MODE_KEY, nextMode)
  }

  return (
    <article className="dashboard-panel">
      <div className="projects-header">
        <div>
          <h1>Projetos Submetidos</h1>
          <p>Selecione um projeto para analisar e decidir.</p>
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

      {isLoading && <p className="dashboard-note">Carregando projetos...</p>}
      {error && <p className="error">{error}</p>}

      {!isLoading && projects.length === 0 && (
        <p className="dashboard-note">Nenhum projeto submetido no momento.</p>
      )}

      <div className={viewMode === 'grid' ? 'projects-list projects-grid' : 'projects-list'}>
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/admin/projetos/${project.id}`}
            className="project-card-link"
          >
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
            </section>
          </Link>
        ))}
      </div>
    </article>
  )
}
