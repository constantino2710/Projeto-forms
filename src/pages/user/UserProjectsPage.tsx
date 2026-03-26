import { Funnel, Grid3X3, List, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { listMyProjects, projectStatusLabel, type UserProject } from '../../features/projects/userProjects'
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
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status],
    )
  }

  const filteredProjects = projects.filter((project) => {
    const matchesName = project.title.toLowerCase().includes(query.trim().toLowerCase())
    const matchesStatus = selectedStatuses.length === 0 ? true : selectedStatuses.includes(project.status)

    return matchesName && matchesStatus
  })

  return (
    <article className={panelClassName}>
      <div className={projectsHeaderClassName}>
        <div>
          <h1 className="m-0 text-[1.4rem]">Meus Projetos</h1>
          <p className="mt-2.5 text-[hsl(var(--muted-foreground))]">Clique em um projeto para abrir os detalhes.</p>
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

      <div className="mt-3 flex flex-col items-stretch gap-2.5 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input
            className="pl-8"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar projeto por nome"
          />
        </div>

        <div className="relative">
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
            <div className="absolute top-[calc(100%+8px)] right-0 z-40 flex min-w-[220px] flex-wrap gap-1.5 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-[0_12px_28px_hsl(var(--foreground)/0.12)] md:right-0 max-[900px]:left-0 max-[900px]:right-auto">
              {ALL_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  className={cn(
                    'cursor-pointer rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-[9px] py-[5px] text-[0.78rem] text-[hsl(var(--foreground))]',
                    selectedStatuses.includes(status) &&
                      'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
                  )}
                  onClick={() => toggleStatus(status)}
                >
                  {projectStatusLabel[status]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading && <p className={noteClassName}>Carregando projetos...</p>}
      {error && <p className={errorClassName}>{error}</p>}

      {!isLoading && filteredProjects.length === 0 && (
        <p className={noteClassName}>Voce ainda nao possui projetos cadastrados.</p>
      )}

      <div className={viewMode === 'grid' ? projectsGridClassName : projectsListClassName}>
        {filteredProjects.map((project) => (
          <Link key={project.id} to={`/usuario/meus-projetos/${project.id}`} className={projectCardLinkClassName}>
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
