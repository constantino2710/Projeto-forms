import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SuperNewUserPage } from './SuperNewUserPage'
import { createSuperUser } from '../../features/super/superAdmin'

vi.mock('../../features/super/superAdmin', () => ({
  createSuperUser: vi.fn(),
}))

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/super/usuarios/novo']}>
      <Routes>
        <Route path="/super/usuarios/novo" element={<SuperNewUserPage />} />
        <Route path="/super/usuarios" element={<p>Lista de usuarios</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe('SuperNewUserPage', () => {
  beforeEach(() => {
    vi.mocked(createSuperUser).mockReset()
  })

  it('renderiza titulo e campos', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Novo Usuario' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome de usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome de exibicao')).toBeInTheDocument()
  })

  it('campo de usuario aceita so digitos quando role e user', async () => {
    renderPage()
    const username = screen.getByLabelText('Nome de usuario') as HTMLInputElement
    await userEvent.type(username, '123abc456')
    expect(username.value).toBe('123456')
  })

  it('alternar para admin permite letras no usuario', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Admin' }))
    const username = screen.getByLabelText('Nome de usuario') as HTMLInputElement
    await userEvent.type(username, 'login_admin')
    expect(username.value).toBe('login_admin')
  })

  it('mostra erro quando senhas nao conferem', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('Nome de usuario'), '12345678901')
    await userEvent.type(screen.getByLabelText('Nome de exibicao'), 'Joao')
    const pwInputs = screen.getAllByDisplayValue('acesso123')
    await userEvent.clear(pwInputs[1])
    await userEvent.type(pwInputs[1], 'outra123')
    await userEvent.click(screen.getByRole('button', { name: /Criar usuario/ }))
    expect(await screen.findByText('As senhas nao conferem.')).toBeInTheDocument()
    expect(createSuperUser).not.toHaveBeenCalled()
  })

  it('submete com payload trimado', async () => {
    vi.mocked(createSuperUser).mockResolvedValue({
      id: 'u1',
      username: '12345678901',
      display_name: 'Joao',
      email: null,
      role: 'user',
      is_active: true,
      avatar_url: null,
      created_at: '2025-01-01',
      total_count: 1,
    })
    renderPage()
    await userEvent.type(screen.getByLabelText('Nome de usuario'), '12345678901')
    await userEvent.type(screen.getByLabelText('Nome de exibicao'), '  Joao  ')
    await userEvent.click(screen.getByRole('button', { name: /Criar usuario/ }))

    await waitFor(() => {
      expect(createSuperUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: '12345678901',
          display_name: 'Joao',
          email: null,
          role: 'user',
          password: 'acesso123',
        }),
      )
    })
  })

  it('mostra mensagem quando createSuperUser lanca', async () => {
    vi.mocked(createSuperUser).mockRejectedValue(new Error('RA ja existe'))
    renderPage()
    await userEvent.type(screen.getByLabelText('Nome de usuario'), '12345678901')
    await userEvent.type(screen.getByLabelText('Nome de exibicao'), 'Joao')
    await userEvent.click(screen.getByRole('button', { name: /Criar usuario/ }))
    expect(await screen.findByText('RA ja existe')).toBeInTheDocument()
  })
})
