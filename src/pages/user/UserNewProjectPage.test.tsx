import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { UserNewProjectPage } from './UserNewProjectPage'
import { createUserProject } from '../../features/projects/userProjects'
import { uploadProjectAttachment } from '../../features/projects/projectAttachments'

vi.mock('../../features/projects/userProjects', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../features/projects/userProjects')>()
  return {
    ...actual,
    createUserProject: vi.fn(),
  }
})
vi.mock('../../features/projects/projectAttachments', () => ({
  uploadProjectAttachment: vi.fn(),
}))
vi.mock('../../features/disciplines/disciplines', () => ({
  listDisciplines: vi.fn().mockResolvedValue([]),
}))

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/usuario/novo-projeto']}>
      <Routes>
        <Route path="/usuario/novo-projeto" element={<UserNewProjectPage />} />
        <Route path="/usuario/meus-projetos" element={<p>Lista de projetos</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe('UserNewProjectPage', () => {
  beforeEach(() => {
    vi.mocked(createUserProject).mockReset()
    vi.mocked(uploadProjectAttachment).mockReset()
  })

  it('renderiza titulo e botoes de tipo', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Novo Projeto' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Projeto de Extensao' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disciplina Extensionista' })).toBeInTheDocument()
  })

  it('renderiza form de extensao por padrao', () => {
    renderPage()
    expect(screen.getByLabelText('Titulo da Iniciativa')).toBeInTheDocument()
  })

  it('alternar para disciplina renderiza form simples', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Disciplina Extensionista' }))
    expect(screen.getByLabelText('Codigo da Disciplina')).toBeInTheDocument()
    expect(screen.getByLabelText('Orcamento')).toBeInTheDocument()
  })

  it('submeter disciplina vazia mostra lista de erros de validacao', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Disciplina Extensionista' }))
    // submit direto contorna a validacao HTML5 nativa para chegarmos na validacao Zod
    const form = screen.getByRole('button', { name: /Criar projeto/ }).closest('form')!
    fireEvent.submit(form)
    expect(await screen.findByText(/Corrija os campos abaixo/)).toBeInTheDocument()
    expect(createUserProject).not.toHaveBeenCalled()
  })

  it('submete disciplina valida e chama createUserProject', async () => {
    vi.mocked(createUserProject).mockResolvedValue({
      id: 'p1',
      title: 'Disc',
      status: 'rascunho',
      created_at: '2025-01-01',
    })
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Disciplina Extensionista' }))
    await userEvent.type(screen.getByLabelText('Disciplina'), 'Disc')
    await userEvent.type(screen.getByLabelText('Area tematica'), 'TIC')
    await userEvent.type(screen.getByLabelText('Codigo da Disciplina'), 'CS1')
    await userEvent.type(screen.getByLabelText('Semestre Letivo'), '2025.1')
    await userEvent.type(screen.getByLabelText('Curso'), 'CC')
    fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: '2025-01-01' } })
    fireEvent.change(screen.getByLabelText('Fim'), { target: { value: '2025-06-30' } })
    await userEvent.type(screen.getByLabelText('Publico-alvo'), 'Comunidade')
    await userEvent.type(screen.getByLabelText('Orcamento'), '500')
    await userEvent.type(screen.getByLabelText('Descricao'), 'Descricao do projeto')
    await userEvent.click(screen.getByRole('button', { name: /Criar projeto/ }))

    await waitFor(() => {
      expect(createUserProject).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Disc',
          type: 'disciplina',
          budget: 500,
        }),
      )
    })
  })

  it('mostra erro quando createUserProject lanca', async () => {
    vi.mocked(createUserProject).mockRejectedValue(new Error('Token expirado'))
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Disciplina Extensionista' }))
    await userEvent.type(screen.getByLabelText('Disciplina'), 'T')
    await userEvent.type(screen.getByLabelText('Area tematica'), 'A')
    await userEvent.type(screen.getByLabelText('Codigo da Disciplina'), 'CS1')
    await userEvent.type(screen.getByLabelText('Semestre Letivo'), '2025.1')
    fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: '2025-01-01' } })
    fireEvent.change(screen.getByLabelText('Fim'), { target: { value: '2025-06-30' } })
    await userEvent.type(screen.getByLabelText('Publico-alvo'), 'X')
    await userEvent.type(screen.getByLabelText('Orcamento'), '100')
    await userEvent.type(screen.getByLabelText('Descricao'), 'D')
    await userEvent.click(screen.getByRole('button', { name: /Criar projeto/ }))

    expect(await screen.findByText('Token expirado')).toBeInTheDocument()
  })
})

