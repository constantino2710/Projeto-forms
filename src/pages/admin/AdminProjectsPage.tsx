import { Grid3X3, List, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { ProjectFiltersBar } from '../../components/projects/ProjectFiltersBar'
import {
  applyProjectFilters,
  emptyProjectFilters,
  type ProjectFilterState,
} from '../../features/projects/projectFilters'
import {
  consumePrefetchedAdminProjects,
  listAdminProjects,
  type AdminProjectCard,
} from '../../features/projects/adminProjects'
import { projectStatusLabel } from '../../features/projects/userProjects'

type ViewMode = 'list' | 'grid'
const VIEW_MODE_KEY = 'admin_projects_view_mode'
const STATUS_OPTIONS = [
  { value: 'submetido', label: projectStatusLabel.submetido },
  { value: 'em_avaliacao', label: projectStatusLabel.em_avaliacao },
]

const mergeUniqueSorted = (current: string[], incoming: (string | null | undefined)[]): string[] => {
  const set = new Set(current)
  for (const value of incoming) {
    if (value) set.add(value)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProjectCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [filters, setFilters] = useState<ProjectFilterState>(emptyProjectFilters)
  const [courseOptions, setCourseOptions] = useState<string[]>([])
  const [schoolOptions, setSchoolOptions] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(VIEW_MODE_KEY)
    return stored === 'grid' ? 'grid' : 'list'
  })

  const loadProjects = async (prefetched: Promise<AdminProjectCard[]> | null = null) => {
    setError('')
    setIsLoading(true)

    try {
      const data = await (prefetched ?? listAdminProjects())
      setProjects(data)
      setCourseOptions((current) => mergeUniqueSorted(current, data.map((p) => p.course)))
      setSchoolOptions((current) => mergeUniqueSorted(current, data.map((p) => p.school)))
    } catch (err) {
      const nextError = err instanceof Error ? err.message : 'Falha ao carregar projetos.'
      setError(nextError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects(consumePrefetchedAdminProjects())
  }, [])

  const handleSetViewMode = (nextMode: ViewMode) => {
    setViewMode(nextMode)
    localStorage.setItem(VIEW_MODE_KEY, nextMode)
  }

  const baseProjects = projects.filter((project) => {
    const matchesName = project.title.toLowerCase().includes(query.trim().toLowerCase())
    const matchesStatus = selectedStatuses.length === 0 ? true : selectedStatuses.includes(project.status)
    return matchesName && matchesStatus
  })
  const filteredProjects = applyProjectFilters(baseProjects, filters)

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

      <div className="projects-toolbar">
        <div className="search-wrap">
          <Search size={14} />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar projeto por nome"
          />
        </div>
        <ProjectFiltersBar
          value={filters}
          onChange={setFilters}
          courses={courseOptions}
          schools={schoolOptions}
          statusOptions={STATUS_OPTIONS}
          selectedStatuses={selectedStatuses}
          onStatusesChange={setSelectedStatuses}
        />
      </div>

      {isLoading && <p className="dashboard-note">Carregando projetos...</p>}
      {error && <p className="error">{error}</p>}

      {!isLoading && filteredProjects.length === 0 && (
        <p className="dashboard-note">Nenhum projeto submetido no momento.</p>
      )}

      <div className={viewMode === 'grid' ? 'projects-list projects-grid' : 'projects-list'}>
        {filteredProjects.map((project) => (
          <Link
            key={project.id}
            to={`/admin/projetos/${project.id}`}
            className="project-card-link"
          >
            <section className="project-card">
              <div className="project-card-top">
                <div className="project-title-wrap">
                  <h2>{project.title}</h2>
                  <span
                    className={`project-type-badge ${
                      project.tipo === 'disciplina' ? 'project-type-badge--disciplina' : 'project-type-badge--extensao'
                    }`}
                  >
                    {project.tipo === 'disciplina' ? 'Disciplina Extensionista' : 'Projeto de Extensão'}
                  </span>
                </div>
                <span className={`status-badge status-${project.status}`}>
                  {projectStatusLabel[project.status]}
                </span>
              </div>
              <p className="project-card-meta">
                Periodo: {project.period_start} ate {project.period_end}
              </p>
              <p className="project-card-meta">Orcamento: R$ {Number(project.budget).toFixed(2)}</p>
            </section>
          </Link>
        ))}
      </div>
    </article>
  )
}
