import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { UserProjectDetailPage } from './UserProjectDetailPage'
import {
  duplicateMyProject,
  getMyProjectDetail,
  type UserProject,
} from '../../features/projects/userProjects'
import { listProjectAttachments } from '../../features/projects/projectAttachments'
import { getProjectTimeline } from '../../features/projects/projectTimeline'

vi.mock('../../features/projects/userProjects', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../features/projects/userProjects')>()
  return {
    ...actual,
    getMyProjectDetail: vi.fn(),
    updateMyProjectDetails: vi.fn(),
    updateMyProjectStatus: vi.fn(),
    deleteMyProject: vi.fn(),
    duplicateMyProject: vi.fn(),
  }
})
vi.mock('../../features/projects/projectAttachments', () => ({
  listProjectAttachments: vi.fn(),
  uploadProjectAttachment: vi.fn(),
  deleteProjectAttachment: vi.fn(),
}))
vi.mock('../../features/projects/projectTimeline', () => ({
  getProjectTimeline: vi.fn(),
}))

const mockProject: UserProject = {
  id: 'p1',
  title: 'Projeto Detalhe',
  tipo: 'disciplina',
  codigo_disciplina: 'CS1',
  semestre_letivo: '2025.1',
  thematic_area: 'TIC',
  course: 'CC',
  school: 'TIC',
  period_start: '2025-01-01',
  period_end: '2025-06-30',
  target_audience: 'Comunidade',
  budget: 500,
  description: 'Descricao',
  status: 'rascunho',
  admin_message: null,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/usuario/meus-projetos/p1']}>
      <Routes>
        <Route path="/usuario/meus-projetos/:projectId" element={<UserProjectDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )

describe('UserProjectDetailPage', () => {
  beforeEach(() => {
    vi.mocked(getMyProjectDetail).mockReset()
    vi.mocked(duplicateMyProject).mockReset()
    vi.mocked(listProjectAttachments).mockReset().mockResolvedValue([])
    vi.mocked(getProjectTimeline).mockReset().mockResolvedValue({
      status: 'rascunho',
      created_at: '2025-01-01',
      submitted_at: null,
      analysis_started_at: null,
      approved_at: null,
      rejected_at: null,
      reviewed_at: null,
    })
  })

  it('mostra loading inicial', () => {
    vi.mocked(getMyProjectDetail).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renderiza titulo do projeto', async () => {
    vi.mocked(getMyProjectDetail).mockResolvedValue(mockProject)
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Projeto Detalhe' })).toBeInTheDocument()
  })

  it('permite duplicar o projeto e navega para o novo id', async () => {
    vi.mocked(getMyProjectDetail).mockImplementation(async (id: string) =>
      id === 'p1' ? mockProject : { ...mockProject, id },
    )
    vi.mocked(duplicateMyProject).mockResolvedValue({
      id: 'p2',
      title: 'Projeto Detalhe',
      status: 'rascunho',
      created_at: '2025-01-02',
    })

    renderPage()

    const duplicateButton = await screen.findByRole('button', { name: /Duplicar/i })
    await userEvent.click(duplicateButton)

    expect(await screen.findByRole('heading', { name: 'Projeto Detalhe' })).toBeInTheDocument()
    expect(vi.mocked(duplicateMyProject)).toHaveBeenCalledWith(mockProject)
    expect(vi.mocked(getMyProjectDetail)).toHaveBeenCalledWith('p2')
  })

  it('mostra erro quando getMyProjectDetail lanca', async () => {
    vi.mocked(getMyProjectDetail).mockRejectedValue(new Error('Projeto nao encontrado.'))
    renderPage()
    expect(await screen.findByText('Projeto nao encontrado.')).toBeInTheDocument()
  })
})
