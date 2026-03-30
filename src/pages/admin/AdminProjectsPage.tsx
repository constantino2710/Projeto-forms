import { Grid3X3, List, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
  const [courseFilter, setCourseFilter] = useState('all')
  const [schoolFilter, setSchoolFilter] = useState('all')
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

  const courseOptions = useMemo(
    () =>
      Array.from(new Set(projects.map((project) => project.course).filter((value): value is string => Boolean(value)))).sort((a, b) =>
        a.localeCompare(b, 'pt-BR'),
      ),
    [projects],
  )

  const schoolOptions = useMemo(
    () =>
      Array.from(new Set(projects.map((project) => project.school).filter((value): value is string => Boolean(value)))).sort((a, b) =>
        a.localeCompare(b, 'pt-BR'),
      ),
    [projects],
  )

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesCourse = courseFilter === 'all' ? true : (project.course ?? '') === courseFilter
        const matchesSchool = schoolFilter === 'all' ? true : (project.school ?? '') === schoolFilter
        return matchesCourse && matchesSchool
      }),
    [projects, courseFilter, schoolFilter],
  )

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

      <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-[0.85rem] font-semibold">
          Filtrar por curso
          <select
            value={courseFilter}
            onChange={(event) => setCourseFilter(event.target.value)}
            className="w-full min-h-10 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-[0.75rem] py-[0.5rem] text-[0.9rem] text-[hsl(var(--foreground))] focus:border-[hsl(var(--ring))] focus:outline-none"
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
            onChange={(event) => setSchoolFilter(event.target.value)}
            className="w-full min-h-10 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-[0.75rem] py-[0.5rem] text-[0.9rem] text-[hsl(var(--foreground))] focus:border-[hsl(var(--ring))] focus:outline-none"
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

      {isLoading && <p className={noteClassName}>Carregando projetos...</p>}
      {error && <p className={errorClassName}>{error}</p>}

      {!isLoading && filteredProjects.length === 0 && (
        <p className={noteClassName}>Nenhum projeto submetido no momento.</p>
      )}

      <div className={viewMode === 'grid' ? projectsGridClassName : projectsListClassName}>
        {filteredProjects.map((project) => (
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
              <div className="mt-2.5 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  {project.professor_avatar_url ? (
                    <img
                      src={project.professor_avatar_url}
                      alt={`Foto de ${project.professor}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={16} />
                  )}
                </div>
                <p className="m-0 text-sm font-medium text-[hsl(var(--foreground))]">{project.professor}</p>
              </div>
            </section>
          </Link>
        ))}
      </div>
    </article>
  )
}
