import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { listSuperHistory, type SuperHistoryRow } from '../../features/super/superAdmin'
import { projectStatusLabel } from '../../features/projects/userProjects'

const PAGE_SIZE = 10

const statusOptions: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'submetido', label: 'Submetidos' },
  { value: 'em_avaliacao', label: 'Em analise' },
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
      setRows(data)
      setTotal(totalCount)
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

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <article className="dashboard-panel">
      <div className="projects-header">
        <div>
          <h1>Historico Geral de Projetos</h1>
          <p>Todos os projetos submetidos na plataforma, independente do revisor.</p>
        </div>
      </div>

      <div className="view-toggle" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        {statusOptions.map((option) => (
          <Button
            key={option.value || 'all'}
            type="button"
            variant="outline"
            size="sm"
            className={statusFilter === option.value ? 'active' : ''}
            onClick={() => handleStatus(option.value)}
          >
            <span>{option.label}</span>
          </Button>
        ))}
      </div>

      <form onSubmit={handleSearchSubmit} className="form" style={{ marginBottom: 16 }}>
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por titulo, professor ou curso"
        />
        <Button type="submit" variant="outline" size="sm">
          Buscar
        </Button>
      </form>

      {isLoading && <p className="dashboard-note">Carregando historico...</p>}
      {error && <p className="error">{error}</p>}
      {!isLoading && rows.length === 0 && (
        <p className="dashboard-note">Nenhum projeto encontrado.</p>
      )}

      <div className="projects-list">
        {rows.map((project) => (
          <Link key={project.id} to={`/admin/projetos/${project.id}`} className="project-card-link">
            <section className="project-card">
              <div className="project-card-top">
                <div className="project-title-wrap">
                  <h2>{project.title}</h2>
                  <span
                    className={`project-type-badge ${
                      project.tipo === 'disciplina'
                        ? 'project-type-badge--disciplina'
                        : 'project-type-badge--extensao'
                    }`}
                  >
                    {project.tipo === 'disciplina' ? 'Disciplina Extensionista' : 'Projeto de Extensão'}
                  </span>
                </div>
                <span className={`status-badge status-${project.status}`}>
                  {projectStatusLabel[project.status]}
                </span>
              </div>
              <p className="project-card-meta">Professor: {project.professor}</p>
              <p className="project-card-meta">
                Periodo: {project.period_start} ate {project.period_end}
              </p>
              <p className="project-card-meta">
                Revisor: {project.reviewer ?? 'pendente'}
                {project.reviewed_at ? ` em ${new Date(project.reviewed_at).toLocaleDateString()}` : ''}
              </p>
            </section>
          </Link>
        ))}
      </div>

      {total > PAGE_SIZE && (
        <div className="view-toggle" style={{ marginTop: 16 }}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </Button>
          <span className="dashboard-note" style={{ alignSelf: 'center', margin: '0 12px' }}>
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
  )
}
