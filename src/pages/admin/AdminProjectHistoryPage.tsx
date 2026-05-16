import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import { PageHeader } from '../../components/layout/PageHeader'
import { ProjectFiltersBar } from '../../components/projects/ProjectFiltersBar'
import { ReportButton } from '../../components/reports/ReportButton'
import {
  emptyProjectFilters,
  type ProjectFilterState,
} from '../../features/projects/projectFilters'
import {
  consumePrefetchedAdminProjectHistory,
  listAdminProjectHistory,
  listAdminProjects,
  type AdminProjectHistoryCard,
} from '../../features/projects/adminProjects'
import {
  adminProjectsToReportRows,
  buildReportData,
  buildReportFilename,
  downloadBlob,
  generateReport,
  type ReportFormat,
  type ReportPeriod,
} from '../../features/reports/projectReports'
import { projectStatusLabel } from '../../features/projects/userProjects'
import {
  dashboardNoteClass,
  dashboardPanelClass,
  errorTextClass,
  historyCardClass,
  historyCardLinkClass,
  historyCardMetaClass,
  historyListClass,
  projectTypeBadgeBaseClass,
  projectTypeBadgeDisciplinaClass,
  projectTypeBadgeExtensaoClass,
  projectsToolbarClass,
  searchWrapClass,
  statusBadgeBaseClass,
  statusColorMap,
  viewToggleClass,
} from '../../lib/projectStyles'
import { cn } from '../../lib/utils'

const PAGE_SIZE = 9
const SEARCH_DEBOUNCE_MS = 350

const STATUS_OPTIONS = [
  { value: 'aprovado', label: projectStatusLabel.aprovado },
  { value: 'reprovado', label: projectStatusLabel.reprovado },
  { value: 'em_ajustes', label: projectStatusLabel.em_ajustes },
]

const mergeUniqueSorted = (current: string[], incoming: (string | null | undefined)[]): string[] => {
  const set = new Set(current)
  for (const value of incoming) {
    if (value) set.add(value)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export function AdminProjectHistoryPage() {
  const [projects, setProjects] = useState<AdminProjectHistoryCard[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [filters, setFilters] = useState<ProjectFilterState>(emptyProjectFilters)
  const [courseOptions, setCourseOptions] = useState<string[]>([])
  const [schoolOptions, setSchoolOptions] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const hasUsedPrefetchRef = useRef(false)

  const handleGenerateReport = async (format: ReportFormat, period: ReportPeriod) => {
    const REPORT_PAGE_LIMIT = 5000
    const [pending, history] = await Promise.all([
      listAdminProjects({ limit: REPORT_PAGE_LIMIT, offset: 0 }),
      listAdminProjectHistory({ limit: REPORT_PAGE_LIMIT, offset: 0 }),
    ])
    const rows = adminProjectsToReportRows(pending.rows, history.rows)
    const data = buildReportData(rows, period)
    const blob = generateReport(data, format)
    downloadBlob(blob, buildReportFilename(format, period))
  }

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
    const prefetched = isPristineFirstLoad ? consumePrefetchedAdminProjectHistory() : null
    if (isPristineFirstLoad) hasUsedPrefetchRef.current = true

    const request =
      prefetched ??
      listAdminProjectHistory({
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
        setError(err instanceof Error ? err.message : 'Falha ao carregar historico.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentPage, debouncedQuery, selectedStatuses, filters])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages - 1)

  return (
    <>
      <PageHeader
        title="Historico de Projetos"
        subtitle="Projetos que voce aprovou, recusou ou enviou para ajustes."
        actions={<ReportButton onGenerate={handleGenerateReport} />}
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
            statusOptions={STATUS_OPTIONS}
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
          <p className={dashboardNoteClass}>Nenhum projeto decidido por voce ainda.</p>
        )}

        <div
          className={cn(
            historyListClass,
            isLoading && projects.length > 0 && 'opacity-60 pointer-events-none transition-opacity',
          )}
        >
          {projects.map((project) => (
            <Link key={project.id} to={`/admin/projetos/${project.id}`} className={historyCardLinkClass}>
              <section className={historyCardClass}>
                <h2>{project.title}</h2>
                <span
                  className={cn(
                    projectTypeBadgeBaseClass,
                    project.tipo === 'disciplina'
                      ? projectTypeBadgeDisciplinaClass
                      : projectTypeBadgeExtensaoClass,
                  )}
                >
                  {project.tipo === 'disciplina' ? 'Disciplina' : 'Extensão'}
                </span>
                <span className={historyCardMetaClass}>
                  {project.period_start} – {project.period_end}
                </span>
                <span className={cn(historyCardMetaClass, 'font-semibold')}>
                  {project.tipo === 'disciplina'
                    ? `${Number(project.budget).toFixed(0)}h de extensao`
                    : `R$ ${Number(project.budget).toFixed(2)}`}
                </span>
                <span className={cn(statusBadgeBaseClass, statusColorMap[project.status])}>
                  {projectStatusLabel[project.status]}
                </span>
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
