import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminProjectsPage } from './AdminProjectsPage'
import {
  consumePrefetchedAdminProjects,
  listAdminProjects,
  type AdminProjectCard,
} from '../../features/projects/adminProjects'

vi.mock('../../features/projects/adminProjects', () => ({
  listAdminProjects: vi.fn(),
  consumePrefetchedAdminProjects: vi.fn(() => null),
  prefetchAdminProjects: vi.fn(),
}))

const mockProjects: AdminProjectCard[] = [
  {
    id: 'p1',
    title: 'Submetido A',
    tipo: 'extensao',
    course: 'CC',
    school: 'TIC',
    period_start: '2025-01-01',
    period_end: '2025-06-30',
    budget: 500,
    status: 'submetido',
    created_at: '2025-01-01',
  },
]

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminProjectsPage />
    </MemoryRouter>,
  )

describe('AdminProjectsPage', () => {
  beforeEach(() => {
    vi.mocked(listAdminProjects).mockReset()
    vi.mocked(consumePrefetchedAdminProjects).mockReturnValue(null)
  })

  it('mostra loading inicial', () => {
    vi.mocked(listAdminProjects).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Carregando projetos...')).toBeInTheDocument()
  })

  it('renderiza projetos submetidos', async () => {
    vi.mocked(listAdminProjects).mockResolvedValue(mockProjects)
    renderPage()
    expect(await screen.findByText('Submetido A')).toBeInTheDocument()
  })

  it('mostra estado vazio', async () => {
    vi.mocked(listAdminProjects).mockResolvedValue([])
    renderPage()
    expect(
      await screen.findByText('Nenhum projeto submetido no momento.'),
    ).toBeInTheDocument()
  })

  it('mostra erro quando listAdminProjects lanca', async () => {
    vi.mocked(listAdminProjects).mockRejectedValue(new Error('Erro RPC'))
    renderPage()
    expect(await screen.findByText('Erro RPC')).toBeInTheDocument()
  })

  it('usa prefetch quando disponivel', async () => {
    vi.mocked(consumePrefetchedAdminProjects).mockReturnValue(
      Promise.resolve(mockProjects),
    )
    renderPage()
    expect(await screen.findByText('Submetido A')).toBeInTheDocument()
    expect(listAdminProjects).not.toHaveBeenCalled()
  })
})
