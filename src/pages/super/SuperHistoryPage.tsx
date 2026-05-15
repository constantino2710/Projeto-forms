import { Search } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
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
import { listSuperHistory, type SuperHistoryRow } from '../../features/super/superAdmin'
import { projectStatusLabel } from '../../features/projects/userProjects'
import {
  activeToggleButtonClass,
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

const PAGE_SIZE = 10

const statusOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'submetido', label: 'Submetidos' },
  { value: 'em_ajustes', label: 'Em ajustes' },
  { value: 'aprovado', label: 'Aprovados' },
  { value: 'reprovado', label: 'Recusados' },
  { value: 'rascunho', label: 'Rascunhos' },
]

export function SuperHistoryPage() {
  const [rows, setRows] = useState<SuperHistoryRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [filters, setFilters] = useState<ProjectFilterState>(emptyProjectFilters)
  const [courseOptions, setCourseOptions] = useState<string[]>([])
  const [schoolOptions, setSchoolOptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    setIsLoading(true)
    try {
      const { rows: data, total: totalCount } = await listSuperHistory({
        search: search || undefined,
        status: statusFilter || null,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      })
      const filtered = data.filter((row) => row.status !== 'em_avaliacao')
      const adjustedTotal = totalCount - (data.length - filtered.length)
      setRows(filtered)
      setTotal(adjustedTotal)
      setCourseOptions((current) => mergeUniqueSorted(current, filtered.map((p) => p.course)))
      setSchoolOptions((current) => mergeUniqueSorted(current, filtered.map((p) => p.school)))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao carregar historico.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter])

  const handleStatus = (next: string) => {
    setPage(0)
    setStatusFilter(next)
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(0)
    setSearch(searchInput.trim())
  }

  const visibleRows = applyProjectFilters(rows, filters)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <PageHeader
        title="Historico Geral de Projetos"
        subtitle="Todos os projetos submetidos na plataforma, independente do revisor."
      />
      <article className={dashboardPanelClass}>
        <div className={cn(viewToggleClass, 'flex-wrap mb-3')}>
        {statusOptions.map((option) => (
          <Button
            key={option.value || 'all'}
            type="button"
            variant="outline"
            size="sm"
            className={statusFilter === option.value ? activeToggleButtonClass : ''}
            onClick={() => handleStatus(option.value)}
          >
            <span>{option.label}</span>
          </Button>
        ))}
      </div>

      <form onSubmit={handleSearchSubmit} className={cn(projectsToolbarClass, 'mb-4')}>
        <div className={searchWrapClass}>
          <Search size={14} />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Buscar por titulo, professor ou curso"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Buscar
        </Button>
        <ProjectFiltersBar
          value={filters}
          onChange={setFilters}
          courses={courseOptions}
          schools={schoolOptions}
        />
      </form>

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
