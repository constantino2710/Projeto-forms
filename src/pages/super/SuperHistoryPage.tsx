import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Spinner } from '../../components/ui/spinner'
import { PageHeader } from '../../components/layout/PageHeader'
import { ProjectFiltersBar } from '../../components/projects/ProjectFiltersBar'
import {
  applyProjectFilters,
  emptyProjectFilters,
  type ProjectFilterState,
} from '../../features/projects/projectFilters'
import { ReportButton } from '../../components/reports/ReportButton'
import { listSuperHistory, type SuperHistoryRow } from '../../features/super/superAdmin'
import {
  buildReportData,
  buildReportFilename,
  downloadBlob,
  generateReport,
  superHistoryToReportRows,
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

const mergeUniqueSorted = (current: string[], incoming: (string | null | undefined)[]): string[] => {
  const set = new Set(current)
  for (const value of incoming) {
    if (value) set.add(value)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 350

const STATUS_OPTIONS = [
  { value: 'submetido', label: projectStatusLabel.submetido },
  { value: 'em_ajustes', label: projectStatusLabel.em_ajustes },
  { value: 'aprovado', label: projectStatusLabel.aprovado },
  { value: 'reprovado', label: projectStatusLabel.reprovado },
]

export function SuperHistoryPage() {
  const [rows, setRows] = useState<SuperHistoryRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [filters, setFilters] = useState<ProjectFilterState>(emptyProjectFilters)
  const [courseOptions, setCourseOptions] = useState<string[]>([])
  const [schoolOptions, setSchoolOptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(handle)
  }, [query])

  useEffect(() => {
    setPage(0)
  }, [debouncedQuery, selectedStatuses, filters])

  useEffect(() => {
    let cancelled = false
    setError('')
    setIsLoading(true)

    const statusForBackend = selectedStatuses.length === 1 ? selectedStatuses[0] : null

    listSuperHistory({
      search: debouncedQuery || undefined,
      status: statusForBackend,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    })
      .then(({ rows: data, total: totalCount }) => {
        if (cancelled) return
        const filtered = data.filter(
          (row) =>
            row.status !== 'em_avaliacao' &&
            row.status !== 'rascunho' &&
            row.status !== 'pre_aprovado' &&
            row.status !== 'pre_reprovado',
        )
        const adjustedTotal = totalCount - (data.length - filtered.length)
        setRows(filtered)
        setTotal(adjustedTotal)
        setCourseOptions((current) => mergeUniqueSorted(current, filtered.map((p) => p.course)))
        setSchoolOptions((current) => mergeUniqueSorted(current, filtered.map((p) => p.school)))
      })
      .catch((err) => {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Falha ao carregar historico.'
        setError(message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, debouncedQuery, selectedStatuses])

  const statusFilteredRows =
    selectedStatuses.length > 1
      ? rows.filter((row) => selectedStatuses.includes(row.status))
      : rows
  const visibleRows = applyProjectFilters(statusFilteredRows, filters)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleGenerateReport = async (format: ReportFormat, period: ReportPeriod) => {
    const { rows: allRows } = await listSuperHistory({ limit: 5000, offset: 0 })
    const reportRows = superHistoryToReportRows(allRows)
    const data = buildReportData(reportRows, period)
    const blob = await generateReport(data, format)
    downloadBlob(blob, buildReportFilename(format, period))
  }

  return (
    <>
      <PageHeader
        title="Historico Geral de Projetos"
        subtitle="Todos os projetos submetidos na plataforma, independente do revisor."
        actions={<ReportButton onGenerate={handleGenerateReport} />}
      />
      <article className={dashboardPanelClass}>
        <div className={projectsToolbarClass}>
          <div className={searchWrapClass}>
            <Search size={14} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por titulo, professor ou curso"
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

        {isLoading && rows.length === 0 && (
          <div className="mt-4 flex justify-center text-muted-foreground">
            <Spinner />
          </div>
        )}
        {error && <p className={errorTextClass}>{error}</p>}
        {!isLoading && visibleRows.length === 0 && (
          <p className={dashboardNoteClass}>Nenhum projeto encontrado.</p>
        )}

        <div
          className={cn(
            historyListClass,
            isLoading && rows.length > 0 && 'opacity-60 pointer-events-none transition-opacity',
          )}
        >
          {visibleRows.map((project) => (
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
                <span className={historyCardMetaClass}>Professor: {project.professor}</span>
                <span className={historyCardMetaClass}>
                  {project.period_start} – {project.period_end}
                </span>
                <span className={historyCardMetaClass}>
                  Revisor: {project.reviewer ?? 'pendente'}
                </span>
                <span className={cn(statusBadgeBaseClass, statusColorMap[project.status])}>
                  {projectStatusLabel[project.status]}
                </span>
              </section>
            </Link>
          ))}
        </div>

        {total > PAGE_SIZE && (
          <div className={cn(viewToggleClass, 'mt-4')}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </Button>
            <span className={cn(dashboardNoteClass, 'self-center mx-3 my-0')}>
              Pagina {page + 1} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Proxima
            </Button>
          </div>
        )}
      </article>
    </>
  )
}
