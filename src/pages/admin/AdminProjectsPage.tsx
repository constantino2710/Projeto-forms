import { Grid3X3, List, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStoredSessionRole } from '../../auth/appAuth'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import { PageHeader } from '../../components/layout/PageHeader'
import { ProjectFiltersBar } from '../../components/projects/ProjectFiltersBar'
import {
  emptyProjectFilters,
  type ProjectFilterState,
} from '../../features/projects/projectFilters'
import {
  consumePrefetchedAdminProjects,
  listAdminProjects,
  type AdminProjectCard,
} from '../../features/projects/adminProjects'
import { projectStatusLabel } from '../../features/projects/userProjects'
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
  projectsListClass,
  projectsToolbarClass,
  searchWrapClass,
  statusBadgeBaseClass,
  statusColorMap,
  viewToggleClass,
} from '../../lib/projectStyles'
import { cn } from '../../lib/utils'

type ViewMode = 'list' | 'grid'
const VIEW_MODE_KEY = 'admin_projects_view_mode'
const PAGE_SIZE = 9
const SEARCH_DEBOUNCE_MS = 350
const STATUS_OPTIONS_ADMIN = [
  { value: 'submetido', label: projectStatusLabel.submetido },
  { value: 'em_avaliacao', label: projectStatusLabel.em_avaliacao },
]
const STATUS_OPTIONS_SUPER = [
  { value: 'submetido', label: projectStatusLabel.submetido },
  { value: 'em_avaliacao', label: projectStatusLabel.em_avaliacao },
  { value: 'pre_aprovado', label: projectStatusLabel.pre_aprovado },
  { value: 'pre_reprovado', label: projectStatusLabel.pre_reprovado },
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
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [filters, setFilters] = useState<ProjectFilterState>(emptyProjectFilters)
  const [courseOptions, setCourseOptions] = useState<string[]>([])
  const [schoolOptions, setSchoolOptions] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(VIEW_MODE_KEY)
    return stored === 'grid' ? 'grid' : 'list'
  })
  const [currentPage, setCurrentPage] = useState(0)
  const hasUsedPrefetchRef = useRef(false)
  const statusOptions = useMemo(
    () => (getStoredSessionRole() === 'superadmin' ? STATUS_OPTIONS_SUPER : STATUS_OPTIONS_ADMIN),
    [],
  )

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [query])

  useEffect(() => {
    setCurrentPage(0)
  }, [debouncedQuery, selectedStatuses, filters])

  useEffect(() => {
    let cancelled = false
    setError('')
    setIsLoading(true)

    const isPristineFirstLoad =
      !hasUsedPrefetchRef.current &&
      currentPage === 0 &&
      debouncedQuery === '' &&
      selectedStatuses.length === 0 &&
      filters === emptyProjectFilters
    const prefetched = isPristineFirstLoad ? consumePrefetchedAdminProjects() : null
    if (isPristineFirstLoad) hasUsedPrefetchRef.current = true

    const request =
      prefetched ??
      listAdminProjects({
        limit: PAGE_SIZE,
        offset: currentPage * PAGE_SIZE,
        query: debouncedQuery || null,
        statuses: selectedStatuses.length > 0 ? selectedStatuses : null,
        course: filters.course,
        school: filters.school,
        sortKey: filters.sortKey,
        sortDir: filters.sortDir,
      })

    request
      .then(({ rows, total: totalCount }) => {
        if (cancelled) return
        setProjects(rows)
        setTotal(totalCount)
        setCourseOptions((current) => mergeUniqueSorted(current, rows.map((p) => p.course)))
        setSchoolOptions((current) => mergeUniqueSorted(current, rows.map((p) => p.school)))
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Falha ao carregar projetos.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentPage, debouncedQuery, selectedStatuses, filters])

  const handleSetViewMode = (nextMode: ViewMode) => {
    setViewMode(nextMode)
    localStorage.setItem(VIEW_MODE_KEY, nextMode)
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages - 1)

  return (
    <>
      <PageHeader
        title="Projetos Submetidos"
        subtitle="Selecione um projeto para analisar e decidir."
        actions={
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
        }
      />
      <article className={dashboardPanelClass}>
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
            statusOptions={statusOptions}
            selectedStatuses={selectedStatuses}
            onStatusesChange={setSelectedStatuses}
          />
        </div>

        {isLoading && projects.length === 0 && (
          <div className="mt-4 flex justify-center text-muted-foreground">
            <Spinner />
          </div>
        )}
        {error && <p className={errorTextClass}>{error}</p>}

        {!isLoading && total === 0 && (
          <p className={dashboardNoteClass}>Nenhum projeto submetido no momento.</p>
        )}

        <div
          className={cn(
            viewMode === 'grid' ? projectsGridClass : projectsListClass,
            isLoading && projects.length > 0 && 'opacity-60 pointer-events-none transition-opacity',
          )}
        >
          {projects.map((project) => (
            <Link key={project.id} to={`/admin/projetos/${project.id}`} className={projectCardLinkClass}>
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
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(statusBadgeBaseClass, statusColorMap[project.status])}>
                      {projectStatusLabel[project.status]}
                    </span>
                    {project.status === 'em_avaliacao' && project.analyzing_by_name && (
                      <span className="inline-flex items-center rounded-full bg-accent/60 px-2 py-0.5 text-[0.72rem] font-semibold text-foreground whitespace-nowrap">
                        por {project.analyzing_by_name}
                      </span>
                    )}
                  </div>
                </div>
                <p className={projectCardMetaClass}>
                  Periodo: {project.period_start} ate {project.period_end}
                </p>
                <p className={projectCardMetaClass}>
                  {project.tipo === 'disciplina'
                    ? `Carga horaria de extensao: ${Number(project.budget).toFixed(0)}h`
                    : `Orcamento: R$ ${Number(project.budget).toFixed(2)}`}
                </p>
              </section>
            </Link>
          ))}
        </div>

        {total > PAGE_SIZE && (
          <div className={cn(viewToggleClass, 'mt-4 items-center')}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            <span className={cn(dashboardNoteClass, 'self-center mx-3 my-0')}>
              Pagina {safePage + 1} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={safePage + 1 >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Proxima
            </Button>
          </div>
        )}
      </article>
    </>
  )
}
