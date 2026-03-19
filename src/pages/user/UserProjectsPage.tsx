import { Funnel, Grid3X3, List, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { listMyProjects, projectStatusLabel, type UserProject } from '../../features/projects/userProjects'

type ViewMode = 'list' | 'grid'
const VIEW_MODE_KEY = 'user_projects_view_mode'
const ALL_STATUSES = ['rascunho', 'submetido', 'em_avaliacao', 'aprovado', 'reprovado'] as const

export function UserProjectsPage() {
  const [projects, setProjects] = useState<UserProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(VIEW_MODE_KEY)
    return stored === 'grid' ? 'grid' : 'list'
  })

  const loadProjects = async () => {
    setError('')
    setIsLoading(true)

    try {
      const data = await listMyProjects()
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

  const toggleStatus = (status: string) => {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    )
  }

  const filteredProjects = projects.filter((project) => {
    const matchesName = project.title.toLowerCase().includes(query.trim().toLowerCase())
    const matchesStatus =
      selectedStatuses.length === 0 ? true : selectedStatuses.includes(project.status)

    return matchesName && matchesStatus
  })

  return (
    <article className="dashboard-panel">
      <div className="projects-header">
        <div>
          <h1>Meus Projetos</h1>
          <p>Clique em um projeto para abrir os detalhes.</p>
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

      <div className="projects-toolbar">
        <div className="search-wrap">
          <Search size={14} />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar projeto por nome"
          />
        </div>

        <div className="filter-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen((state) => !state)}
          >
            <Funnel size={14} />
            <span>Filtros</span>
          </Button>

          {isFilterOpen && (
            <div className="filter-popover">
              {ALL_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={
                    selectedStatuses.includes(status)
                      ? 'filter-tag filter-tag-active'
                      : 'filter-tag'
                  }
                  onClick={() => toggleStatus(status)}
                >
                  {projectStatusLabel[status]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading && <p className="dashboard-note">Carregando projetos...</p>}
      {error && <p className="error">{error}</p>}

      {!isLoading && filteredProjects.length === 0 && (
        <p className="dashboard-note">Voce ainda nao possui projetos cadastrados.</p>
      )}

      <div className={viewMode === 'grid' ? 'projects-list projects-grid' : 'projects-list'}>
        {filteredProjects.map((project) => (
          <Link
            key={project.id}
            to={`/usuario/meus-projetos/${project.id}`}
            className="project-card-link"
          >
            <section className="project-card">
              <div className="project-card-top">
                <h2>{project.title}</h2>
                <span className={`status-badge status-${project.status}`}>
                  {projectStatusLabel[project.status]}
                </span>
              </div>

              <p>Area: {project.thematic_area}</p>
              <p>Publico-alvo: {project.target_audience}</p>
              <p>
                Periodo: {project.period_start} ate {project.period_end}
              </p>
              <p>Orcamento: R$ {Number(project.budget).toFixed(2)}</p>
            </section>
          </Link>
        ))}
      </div>
    </article>
  )
}
