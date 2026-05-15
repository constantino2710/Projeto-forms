import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminProjectHistoryPage } from './AdminProjectHistoryPage'
import {
  listAdminProjectHistory,
  type AdminProjectHistoryCard,
} from '../../features/projects/adminProjects'

vi.mock('../../features/projects/adminProjects', () => ({
  listAdminProjectHistory: vi.fn(),
  prefetchAdminProjectHistory: vi.fn(),
  consumePrefetchedAdminProjectHistory: vi.fn(() => null),
}))

const mockHistory: AdminProjectHistoryCard[] = [
  {
    id: 'p1',
    title: 'Aprovado A',
    tipo: 'extensao',
    course: 'CC',
    school: 'TIC',
    period_start: '2025-01-01',
    period_end: '2025-06-30',
    budget: 500,
    status: 'aprovado',
    reviewed_at: '2025-02-01',
  },
]

const renderPage = () =>
  render(
    <MemoryRouter>
      <AdminProjectHistoryPage />
    </MemoryRouter>,
  )

describe('AdminProjectHistoryPage', () => {
  beforeEach(() => {
    vi.mocked(listAdminProjectHistory).mockReset()
  })

  it('mostra loading inicial', () => {
    vi.mocked(listAdminProjectHistory).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renderiza historico retornado', async () => {
    vi.mocked(listAdminProjectHistory).mockResolvedValue({
      rows: mockHistory,
      total: mockHistory.length,
    })
    renderPage()
    expect(await screen.findByText('Aprovado A')).toBeInTheDocument()
  })

  it('mostra estado vazio', async () => {
    vi.mocked(listAdminProjectHistory).mockResolvedValue({ rows: [], total: 0 })
    renderPage()
    expect(
      await screen.findByText('Nenhum projeto decidido por voce ainda.'),
    ).toBeInTheDocument()
  })

  it('mostra erro quando RPC lanca', async () => {
    vi.mocked(listAdminProjectHistory).mockRejectedValue(new Error('falha'))
    renderPage()
    expect(await screen.findByText('falha')).toBeInTheDocument()
  })
})
