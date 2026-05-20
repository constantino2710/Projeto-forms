import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminProjectDetailPage } from './AdminProjectDetailPage'
import {
  getAdminProjectDetail,
  type AdminProjectDetail,
} from '../../features/projects/adminProjects'
import { getProjectTimeline } from '../../features/projects/projectTimeline'

vi.mock('../../features/projects/adminProjects', () => ({
  getAdminProjectDetail: vi.fn(),
  decideAdminProject: vi.fn(),
}))
vi.mock('../../features/projects/projectTimeline', () => ({
  getProjectTimeline: vi.fn(),
}))
vi.mock('../../features/notifications/projectEmails', () => ({
  sendProjectStatusEmail: vi.fn(),
}))

const mockProject: AdminProjectDetail = {
  id: 'p1',
  title: 'Projeto Admin Detalhe',
  tipo: 'extensao',
  professor: 'Prof Joao',
  professor_avatar_url: null,
  discipline: 'TIC',
  course: 'CC',
  period_start: '2025-01-01',
  period_end: '2025-06-30',
  target_audience: 'Comunidade',
  budget: 0,
  description: 'D',
  status: 'submetido',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  analyzing_by_name: null,
  reviewed_by_name: null,
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/admin/projetos/p1']}>
      <Routes>
        <Route path="/admin/projetos/:projectId" element={<AdminProjectDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )

describe('AdminProjectDetailPage', () => {
  beforeEach(() => {
    vi.mocked(getAdminProjectDetail).mockReset()
    vi.mocked(getProjectTimeline).mockReset().mockResolvedValue({
      status: 'submetido',
      created_at: '2025-01-01',
      submitted_at: '2025-01-02',
      analysis_started_at: null,
      approved_at: null,
      rejected_at: null,
    })
  })

  it('mostra loading inicial', () => {
    vi.mocked(getAdminProjectDetail).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renderiza titulo e nome do professor', async () => {
    vi.mocked(getAdminProjectDetail).mockResolvedValue(mockProject)
    renderPage()
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Projeto Admin Detalhe' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Prof Joao/)).toBeInTheDocument()
  })

  it('mostra erro quando getAdminProjectDetail lanca', async () => {
    vi.mocked(getAdminProjectDetail).mockRejectedValue(new Error('Projeto nao encontrado.'))
    renderPage()
    expect(await screen.findByText('Projeto nao encontrado.')).toBeInTheDocument()
  })
})
