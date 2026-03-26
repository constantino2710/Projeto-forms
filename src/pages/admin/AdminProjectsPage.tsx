import { Grid3X3, List } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { listAdminProjects, type AdminProjectCard } from '../../features/projects/adminProjects'
import {
  errorClassName,
  noteClassName,
  panelClassName,
  projectCardClassName,
  projectCardLinkClassName,
  projectCardMetaClassName,
  projectCardTopClassName,
  projectTitleClassName,
  projectTitleWrapClassName,
  projectsGridClassName,
  projectsHeaderClassName,
  projectsListClassName,
  projectTypeBadgeClassName,
  statusBadgeClassName,
  viewToggleActiveClassName,
  viewToggleClassName,
} from '../../features/projects/projectUi'
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
    <article className={panelClassName}>
      <div className={projectsHeaderClassName}>
        <div>
          <h1 className="m-0 text-[1.4rem]">Projetos Submetidos</h1>
          <p className="mt-2.5 text-[hsl(var(--muted-foreground))]">Selecione um projeto para analisar e decidir.</p>
        </div>
        <div className={viewToggleClassName}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={viewMode === 'list' ? viewToggleActiveClassName : ''}
            onClick={() => handleSetViewMode('list')}
          >
            <List size={14} />
            <span>Lista</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={viewMode === 'grid' ? viewToggleActiveClassName : ''}
            onClick={() => handleSetViewMode('grid')}
          >
            <Grid3X3 size={14} />
            <span>Grid</span>
          </Button>
        </div>
      </div>

      {isLoading && <p className={noteClassName}>Carregando projetos...</p>}
      {error && <p className={errorClassName}>{error}</p>}

      {!isLoading && projects.length === 0 && (
        <p className={noteClassName}>Nenhum projeto submetido no momento.</p>
      )}

      <div className={viewMode === 'grid' ? projectsGridClassName : projectsListClassName}>
        {projects.map((project) => (
          <Link key={project.id} to={`/admin/projetos/${project.id}`} className={projectCardLinkClassName}>
            <section className={projectCardClassName}>
              <div className={projectCardTopClassName}>
                <div className={projectTitleWrapClassName}>
                  <h2 className={projectTitleClassName}>{project.title}</h2>
                  <span className={projectTypeBadgeClassName(project.tipo)}>
                    {project.tipo === 'disciplina' ? 'Disciplina Extensionista' : 'Projeto de Extensao'}
                  </span>
                </div>
                <span className={statusBadgeClassName(project.status)}>
                  {projectStatusLabel[project.status]}
                </span>
              </div>
              <p className={projectCardMetaClassName}>
                Periodo: {project.period_start} ate {project.period_end}
              </p>
              <p className={projectCardMetaClassName}>Orcamento: R$ {Number(project.budget).toFixed(2)}</p>
            </section>
          </Link>
        ))}
      </div>
    </article>
  )
}
