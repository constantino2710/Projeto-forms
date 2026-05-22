import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AdminProjectDetailPage } from './AdminProjectDetailPage'
import {
  decideAdminProject,
  deleteAdminProject,
  getAdminProjectDetail,
  type AdminProjectDecisionResult,
  type AdminProjectDetail,
} from '../../features/projects/adminProjects'
import { getProjectTimeline } from '../../features/projects/projectTimeline'
import { sendProjectStatusEmail } from '../../features/notifications/projectEmails'

vi.mock('../../features/projects/adminProjects', () => ({
  getAdminProjectDetail: vi.fn(),
  decideAdminProject: vi.fn(),
  deleteAdminProject: vi.fn(),
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
    vi.mocked(decideAdminProject).mockReset()
    vi.mocked(deleteAdminProject).mockReset()
    vi.mocked(sendProjectStatusEmail).mockReset()
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

  it('aprovar sem email do professor mostra aviso e nao chama envio de email', async () => {
    vi.useFakeTimers()
    vi.mocked(getAdminProjectDetail).mockResolvedValue(mockProject)
    const decision: AdminProjectDecisionResult = {
      id: 'p1',
      status: 'aprovado',
      updated_at: '2025-01-01',
      project_title: 'Projeto Admin Detalhe',
      professor_name: 'Prof Joao',
      recipient_email: null,
      admin_message: null,
    }
    vi.mocked(decideAdminProject).mockResolvedValue(decision)

    renderPage()
    await screen.findByRole('heading', { level: 1, name: 'Projeto Admin Detalhe' })

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    await user.click(screen.getByRole('button', { name: 'Aprovar' }))

    expect(
      await screen.findByText(
        /Decisao registrada. Professor sem e-mail cadastrado, nao foi notificado\./,
      ),
    ).toBeInTheDocument()
    expect(sendProjectStatusEmail).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('botao Excluir abre modal e exige texto exato', async () => {
    vi.mocked(getAdminProjectDetail).mockResolvedValue(mockProject)
    vi.mocked(deleteAdminProject).mockResolvedValue(undefined)

    renderPage()
    await screen.findByRole('heading', { level: 1, name: 'Projeto Admin Detalhe' })

    await userEvent.click(screen.getByRole('button', { name: /Excluir projeto/ }))

    expect(screen.getByText('Excluir projeto?')).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', { name: /^Excluir$/ })
    expect(confirmButton).toBeDisabled()

    await userEvent.type(screen.getByRole('textbox'), 'errado')
    expect(confirmButton).toBeDisabled()

    await userEvent.clear(screen.getByRole('textbox'))
    await userEvent.type(screen.getByRole('textbox'), 'EXCLUIR')
    expect(confirmButton).toBeEnabled()

    await userEvent.click(confirmButton)
    await waitFor(() => {
      expect(deleteAdminProject).toHaveBeenCalledWith('p1')
    })
  })

  it('Cancelar do modal de excluir nao chama deleteAdminProject', async () => {
    vi.mocked(getAdminProjectDetail).mockResolvedValue(mockProject)

    renderPage()
    await screen.findByRole('heading', { level: 1, name: 'Projeto Admin Detalhe' })

    await userEvent.click(screen.getByRole('button', { name: /Excluir projeto/ }))
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/ }))

    expect(deleteAdminProject).not.toHaveBeenCalled()
  })
})
