import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { UserProjectsPage } from './UserProjectsPage'
import { listMyProjects, type UserProject } from '../../features/projects/userProjects'

vi.mock('../../features/projects/userProjects', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../features/projects/userProjects')>()
  return {
    ...actual,
    listMyProjects: vi.fn(),
  }
})

const mockProjects: UserProject[] = [
  {
    id: 'p1',
    title: 'Projeto Alfa',
    tipo: 'extensao',
    codigo_disciplina: null,
    semestre_letivo: null,
    thematic_area: 'TIC',
    course: 'CC',
    school: 'TIC',
    period_start: '2025-01-01',
    period_end: '2025-06-30',
    target_audience: 'Comunidade',
    budget: 500,
    description: 'D',
    status: 'rascunho',
    admin_message: null,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  },
  {
    id: 'p2',
    title: 'Projeto Beta',
    tipo: 'disciplina',
    codigo_disciplina: 'CS1',
    semestre_letivo: '2025.1',
    thematic_area: 'Educacao',
    course: 'Pedagogia',
    school: 'Humanas',
    period_start: '2025-02-01',
    period_end: '2025-08-30',
    target_audience: 'Escolas',
    budget: 1200,
    description: 'D',
    status: 'aprovado',
    admin_message: null,
    created_at: '2025-02-01',
    updated_at: '2025-02-01',
  },
]

const renderPage = () =>
  render(
    <MemoryRouter>
      <UserProjectsPage />
    </MemoryRouter>,
  )

describe('UserProjectsPage', () => {
  beforeEach(() => {
    vi.mocked(listMyProjects).mockReset()
  })

  it('mostra estado de loading', () => {
    vi.mocked(listMyProjects).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Carregando projetos...')).toBeInTheDocument()
  })

  it('renderiza projetos retornados', async () => {
    vi.mocked(listMyProjects).mockResolvedValue(mockProjects)
    renderPage()
    expect(await screen.findByText('Projeto Alfa')).toBeInTheDocument()
    expect(screen.getByText('Projeto Beta')).toBeInTheDocument()
  })

  it('renderiza estado vazio quando lista esta vazia', async () => {
    vi.mocked(listMyProjects).mockResolvedValue([])
    renderPage()
    expect(
      await screen.findByText('Voce ainda nao possui projetos cadastrados.'),
    ).toBeInTheDocument()
  })

  it('mostra erro quando listMyProjects lanca', async () => {
    vi.mocked(listMyProjects).mockRejectedValue(new Error('Falha de rede'))
    renderPage()
    expect(await screen.findByText('Falha de rede')).toBeInTheDocument()
  })

  it('filtra projetos pelo campo de busca', async () => {
    vi.mocked(listMyProjects).mockResolvedValue(mockProjects)
    renderPage()
    await screen.findByText('Projeto Alfa')

    const search = screen.getByPlaceholderText('Pesquisar projeto por nome')
    await userEvent.type(search, 'beta')

    await waitFor(() => {
      expect(screen.queryByText('Projeto Alfa')).not.toBeInTheDocument()
      expect(screen.getByText('Projeto Beta')).toBeInTheDocument()
    })
  })

  it('mostra labels de tipo (Extensao/Disciplina)', async () => {
    vi.mocked(listMyProjects).mockResolvedValue(mockProjects)
    renderPage()
    expect(await screen.findByText('Projeto de Extensão')).toBeInTheDocument()
    expect(screen.getByText('Disciplina Extensionista')).toBeInTheDocument()
  })

  it('persiste modo de visualizacao em localStorage', async () => {
    vi.mocked(listMyProjects).mockResolvedValue([])
    renderPage()
    await screen.findByText('Voce ainda nao possui projetos cadastrados.')
    await userEvent.click(screen.getByRole('button', { name: /Grid/ }))
    expect(localStorage.getItem('user_projects_view_mode')).toBe('grid')
  })
})
