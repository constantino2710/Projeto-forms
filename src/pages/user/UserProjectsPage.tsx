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
import { listMyProjects, projectStatusLabel, type UserProject } from '../../features/projects/userProjects'
import {
  activeToggleButtonClass,
  dashboardNoteClass,
  dashboardPanelClass,
  errorTextClass,
  projectCardClass,
  projectCardLinkClass,
  projectCardMetaClass,
  projectCardTopClass,
  projectTitleWrapClass,
  projectTypeBadgeBaseClass,
  projectTypeBadgeDisciplinaClass,
  projectTypeBadgeExtensaoClass,
  projectsGridClass,
  projectsHeaderClass,
  projectsListClass,
  projectsToolbarClass,
  searchWrapClass,
  statusBadgeBaseClass,
  statusColorMap,
  viewToggleClass,
} from '../../lib/projectStyles'
import { cn } from '../../lib/utils'

type ViewMode = 'list' | 'grid'
const VIEW_MODE_KEY = 'user_projects_view_mode'
const STATUS_OPTIONS = [
  { value: 'rascunho', label: projectStatusLabel.rascunho },
  { value: 'submetido', label: projectStatusLabel.submetido },
  { value: 'em_avaliacao', label: projectStatusLabel.em_avaliacao },
  { value: 'em_ajustes', label: projectStatusLabel.em_ajustes },
  { value: 'aprovado', label: projectStatusLabel.aprovado },
  { value: 'reprovado', label: projectStatusLabel.reprovado },
]

const mergeUniqueSorted = (current: string[], incoming: (string | null | undefined)[]): string[] => {
  const set = new Set(current)
  for (const value of incoming) {
    if (value) set.add(value)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function UserProjectsPage() {
  const [projects, setProjects] = useState<UserProject[]>([])
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

  const loadProjects = async () => {
    setError('')
    setIsLoading(true)

    try {
      const data = await listMyProjects()
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
    loadProjects()
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
    <article className={dashboardPanelClass}>
      <div className={projectsHeaderClass}>
        <div>
          <h1>Meus Projetos</h1>
          <p>Clique em um projeto para abrir os detalhes.</p>
        </div>
        <div className={viewToggleClass}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={viewMode === 'list' ? activeToggleButtonClass : ''}
            onClick={() => handleSetViewMode('list')}
          >
            <List size={14} />
            <span>Lista</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={viewMode === 'grid' ? activeToggleButtonClass : ''}
            onClick={() => handleSetViewMode('grid')}
          >
            <Grid3X3 size={14} />
            <span>Grid</span>
          </Button>
        </div>
      </div>

      <div className={projectsToolbarClass}>
        <div className={searchWrapClass}>
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

      {isLoading && <p className={dashboardNoteClass}>Carregando projetos...</p>}
      {error && <p className={errorTextClass}>{error}</p>}

      {!isLoading && filteredProjects.length === 0 && (
        <p className={dashboardNoteClass}>Voce ainda nao possui projetos cadastrados.</p>
      )}

      <div className={viewMode === 'grid' ? projectsGridClass : projectsListClass}>
        {filteredProjects.map((project) => (
          <Link key={project.id} to={`/usuario/meus-projetos/${project.id}`} className={projectCardLinkClass}>
            <section className={projectCardClass}>
              <div className={projectCardTopClass}>
                <div className={projectTitleWrapClass}>
                  <h2>{project.title}</h2>
                  <span
                    className={cn(
                      projectTypeBadgeBaseClass,
                      project.tipo === 'disciplina'
                        ? projectTypeBadgeDisciplinaClass
                        : projectTypeBadgeExtensaoClass,
                    )}
                  >
                    {project.tipo === 'disciplina' ? 'Disciplina Extensionista' : 'Projeto de Extensão'}
                  </span>
                </div>

                <span className={cn(statusBadgeBaseClass, statusColorMap[project.status])}>
                  {projectStatusLabel[project.status]}
                </span>
              </div>

              <p className={projectCardMetaClass}>
                Periodo: {project.period_start} ate {project.period_end}
              </p>
              <p className={projectCardMetaClass}>Orcamento: R$ {Number(project.budget).toFixed(2)}</p>
            </section>
          </Link>
        ))}
      </div>
    </article>
  )
}
