import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SuperHistoryPage } from './SuperHistoryPage'
import { listSuperHistory, type SuperHistoryRow } from '../../features/super/superAdmin'

vi.mock('../../features/super/superAdmin', () => ({
  listSuperHistory: vi.fn(),
}))

const mockRows: SuperHistoryRow[] = [
  {
    id: 'p1',
    title: 'Projeto Geral',
    tipo: 'extensao',
    course: 'CC',
    school: 'TIC',
    period_start: '2025-01-01',
    period_end: '2025-06-30',
    budget: 500,
    status: 'aprovado',
    professor: 'Joao',
    reviewer: 'Maria',
    reviewed_at: '2025-02-01',
    created_at: '2025-01-01',
    total_count: 1,
  },
]

const renderPage = () =>
  render(
    <MemoryRouter>
      <SuperHistoryPage />
    </MemoryRouter>,
  )

describe('SuperHistoryPage', () => {
  beforeEach(() => {
    vi.mocked(listSuperHistory).mockReset()
  })

  it('mostra loading inicial', () => {
    vi.mocked(listSuperHistory).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renderiza projetos retornados', async () => {
    vi.mocked(listSuperHistory).mockResolvedValue({ rows: mockRows, total: 1 })
    renderPage()
    expect(await screen.findByText('Projeto Geral')).toBeInTheDocument()
    expect(screen.getByText(/Professor: Joao/)).toBeInTheDocument()
  })

  it('mostra estado vazio', async () => {
    vi.mocked(listSuperHistory).mockResolvedValue({ rows: [], total: 0 })
    renderPage()
    expect(await screen.findByText('Nenhum projeto encontrado.')).toBeInTheDocument()
  })

  it('mostra erro quando RPC lanca', async () => {
    vi.mocked(listSuperHistory).mockRejectedValue(new Error('falha'))
    renderPage()
    expect(await screen.findByText('falha')).toBeInTheDocument()
  })
})
