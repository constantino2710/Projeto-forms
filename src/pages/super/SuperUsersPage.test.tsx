import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SuperUsersPage } from './SuperUsersPage'
import {
  deleteSuperUser,
  listSuperUsers,
  resetSuperUserPassword,
  updateSuperUser,
  type SuperUserRow,
} from '../../features/super/superAdmin'

vi.mock('../../features/super/superAdmin', () => ({
  listSuperUsers: vi.fn(),
  deleteSuperUser: vi.fn(),
  resetSuperUserPassword: vi.fn(),
  updateSuperUser: vi.fn(),
}))

const mockRows: SuperUserRow[] = [
  {
    id: 'u1',
    username: '12345678901',
    display_name: 'Prof Joao',
    email: 'joao@x.com',
    role: 'user',
    is_active: true,
    avatar_url: null,
    created_at: '2025-01-01',
    total_count: 1,
  },
]

const renderPage = () =>
  render(
    <MemoryRouter>
      <SuperUsersPage />
    </MemoryRouter>,
  )

describe('SuperUsersPage', () => {
  beforeEach(() => {
    vi.mocked(listSuperUsers).mockReset()
    vi.mocked(deleteSuperUser).mockReset()
    vi.mocked(resetSuperUserPassword).mockReset()
    vi.mocked(updateSuperUser).mockReset()
  })

  it('mostra loading inicial', () => {
    vi.mocked(listSuperUsers).mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Carregando usuarios...')).toBeInTheDocument()
  })

  it('renderiza usuarios retornados', async () => {
    vi.mocked(listSuperUsers).mockResolvedValue({ rows: mockRows, total: 1 })
    renderPage()
    expect(await screen.findByText('Prof Joao')).toBeInTheDocument()
    expect(screen.getByText('@12345678901')).toBeInTheDocument()
    expect(screen.getByText('joao@x.com')).toBeInTheDocument()
  })

  it('mostra estado vazio', async () => {
    vi.mocked(listSuperUsers).mockResolvedValue({ rows: [], total: 0 })
    renderPage()
    expect(await screen.findByText('Nenhum usuario encontrado.')).toBeInTheDocument()
  })

  it('mostra erro quando RPC lanca', async () => {
    vi.mocked(listSuperUsers).mockRejectedValue(new Error('falha de usuarios'))
    renderPage()
    expect(await screen.findByText('falha de usuarios')).toBeInTheDocument()
  })

  it('clicar em Editar abre painel com nome preenchido', async () => {
    vi.mocked(listSuperUsers).mockResolvedValue({ rows: mockRows, total: 1 })
    renderPage()
    await screen.findByText('Prof Joao')

    await userEvent.click(screen.getByRole('button', { name: /Editar/ }))
    expect(screen.getByText(/Editar Prof Joao/)).toBeInTheDocument()
  })

  it('clicar em Remover abre confirmacao e chama deleteSuperUser', async () => {
    vi.mocked(listSuperUsers).mockResolvedValue({ rows: mockRows, total: 1 })
    vi.mocked(deleteSuperUser).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Prof Joao')

    await userEvent.click(screen.getByRole('button', { name: /Remover/ }))
    await userEvent.click(screen.getByRole('button', { name: /Confirmar remocao/ }))

    await waitFor(() => {
      expect(deleteSuperUser).toHaveBeenCalledWith({ id: 'u1' })
    })
  })

  it('mostra erro quando senhas nao conferem ao redefinir', async () => {
    vi.mocked(listSuperUsers).mockResolvedValue({ rows: mockRows, total: 1 })
    renderPage()
    await screen.findByText('Prof Joao')

    await userEvent.click(screen.getByRole('button', { name: /Redefinir senha/ }))
    // primeiro input vazio e o de busca; pulamos para os dois de senha
    const emptyInputs = screen.getAllByDisplayValue('')
    await userEvent.type(emptyInputs[1], 'aaaaaa')
    await userEvent.type(emptyInputs[2], 'bbbbbb')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(await screen.findByText('As senhas nao conferem.')).toBeInTheDocument()
    expect(resetSuperUserPassword).not.toHaveBeenCalled()
  })

  it('redefinir senha com confirmacao igual chama resetSuperUserPassword', async () => {
    vi.mocked(listSuperUsers).mockResolvedValue({ rows: mockRows, total: 1 })
    vi.mocked(resetSuperUserPassword).mockResolvedValue(undefined)
    renderPage()
    await screen.findByText('Prof Joao')

    await userEvent.click(screen.getByRole('button', { name: /Redefinir senha/ }))
    const emptyInputs = screen.getAllByDisplayValue('')
    await userEvent.type(emptyInputs[1], 'nova123')
    await userEvent.type(emptyInputs[2], 'nova123')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }))

    await waitFor(() => {
      expect(resetSuperUserPassword).toHaveBeenCalledWith({ id: 'u1', password: 'nova123' })
    })
  })
})
