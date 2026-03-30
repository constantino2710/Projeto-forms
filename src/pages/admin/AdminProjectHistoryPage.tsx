import { Grid3X3, List } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import {
  listAdminProjectHistoryPage,
  type AdminProjectHistoryCard,
} from '../../features/projects/adminProjects'
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
import { listProjectCatalogOptions, projectStatusLabel } from '../../features/projects/userProjects'

type ViewMode = 'list' | 'grid'
const VIEW_MODE_KEY = 'admin_history_view_mode'
const PAGE_SIZE = 6

export function AdminProjectHistoryPage() {
  const [projects, setProjects] = useState<AdminProjectHistoryCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCatalogLoading, setIsCatalogLoading] = useState(true)
  const [courseOptions, setCourseOptions] = useState<string[]>([])
  const [schoolOptions, setSchoolOptions] = useState<string[]>([])
  const [courseFilter, setCourseFilter] = useState('all')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem(VIEW_MODE_KEY)
    return stored === 'grid' ? 'grid' : 'list'
  })

  useEffect(() => {
    const load = async () => {
      setError('')
      setIsLoading(true)
      try {
        const result = await listAdminProjectHistoryPage({
          limit: PAGE_SIZE,
          offset: (page - 1) * PAGE_SIZE,
          course: courseFilter === 'all' ? null : courseFilter,
          school: schoolFilter === 'all' ? null : schoolFilter,
        })
        setProjects(result.items)
        setTotalCount(result.total)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Falha ao carregar historico.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [page, courseFilter, schoolFilter])

  useEffect(() => {
    const loadCatalog = async () => {
      setIsCatalogLoading(true)
      try {
        const data = await listProjectCatalogOptions()
        setCourseOptions(data.courses)
        setSchoolOptions(data.schools)
      } finally {
        setIsCatalogLoading(false)
      }
    }

    loadCatalog()
  }, [])

  const handleSetViewMode = (nextMode: ViewMode) => {
    setViewMode(nextMode)
    localStorage.setItem(VIEW_MODE_KEY, nextMode)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  return (
    <article className={panelClassName}>
      <div className={projectsHeaderClassName}>
        <div>
          <h1 className="m-0 text-[1.4rem]">Historico de Projetos</h1>
          <p className="mt-2.5 text-[hsl(var(--muted-foreground))]">Projetos que voce aprovou, recusou ou enviou para ajustes.</p>
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

      <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-[0.85rem] font-semibold">
          Filtrar por curso
          <select
            value={courseFilter}
            onChange={(event) => {
              setCourseFilter(event.target.value)
              setPage(1)
            }}
            className="w-full min-h-10 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-[0.75rem] py-[0.5rem] text-[0.9rem] text-[hsl(var(--foreground))] focus:border-[hsl(var(--ring))] focus:outline-none"
            disabled={isCatalogLoading}
          >
            <option value="all">Todos os cursos</option>
            {courseOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[0.85rem] font-semibold">
          Filtrar por escola
          <select
            value={schoolFilter}
            onChange={(event) => {
              setSchoolFilter(event.target.value)
              setPage(1)
            }}
            className="w-full min-h-10 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-[0.75rem] py-[0.5rem] text-[0.9rem] text-[hsl(var(--foreground))] focus:border-[hsl(var(--ring))] focus:outline-none"
            disabled={isCatalogLoading}
          >
            <option value="all">Todas as escolas</option>
            {schoolOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p className={noteClassName}>Carregando historico...</p>}
      {error && <p className={errorClassName}>{error}</p>}
      {!isLoading && projects.length === 0 && (
        <p className={noteClassName}>Nenhum projeto decidido por voce ainda.</p>
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
              <p className={projectCardMetaClassName}>Curso: {project.course || '-'}</p>
              <p className={projectCardMetaClassName}>Escola: {project.school || '-'}</p>
              <p className={projectCardMetaClassName}>Orcamento: R$ {Number(project.budget).toFixed(2)}</p>
            </section>
          </Link>
        ))}
      </div>

      {!isLoading && totalCount > 0 && (
        <div className="mt-4 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>
          <p className="m-0 text-[0.86rem] text-[hsl(var(--muted-foreground))]">
            Pagina {page} de {totalPages}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Proxima
          </Button>
        </div>
      )}
    </article>
  )
}
