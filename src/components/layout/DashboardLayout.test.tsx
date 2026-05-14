import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import { DashboardLayout } from './DashboardLayout'
import { logoutSession, updateMyAvatar } from '../../auth/appAuth'
import type { AuthSession } from '../../App'

vi.mock('../../auth/appAuth', () => ({
  logoutSession: vi.fn(),
  updateMyAvatar: vi.fn(),
}))

const mockSession: AuthSession = {
  token: 'tok',
  user_id: 'u-1',
  username: 'joao',
  display_name: 'Joao Silva',
  avatar_url: null,
  role: 'user',
}

const items = [{ label: 'Meus Projetos', to: '/usuario/meus-projetos', icon: FolderKanban }]

const renderLayout = (override?: Partial<AuthSession>, onLogout = vi.fn()) =>
  render(
    <MemoryRouter initialEntries={['/usuario/meus-projetos']}>
      <Routes>
        <Route
          path="/usuario"
          element={
            <DashboardLayout
              session={{ ...mockSession, ...override }}
              items={items}
              onLogout={onLogout}
            />
          }
        >
          <Route path="meus-projetos" element={<p>Pagina filha</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.mocked(logoutSession).mockReset()
    vi.mocked(updateMyAvatar).mockReset()
  })

  it('renderiza nome e username do usuario', () => {
    renderLayout()
    expect(screen.getByText('Joao Silva')).toBeInTheDocument()
    expect(screen.getByText('@joao')).toBeInTheDocument()
  })

  it('renderiza os items do menu', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: /Meus Projetos/ })).toBeInTheDocument()
  })

  it('renderiza o Outlet com o conteudo da rota filha', () => {
    renderLayout()
    expect(screen.getByText('Pagina filha')).toBeInTheDocument()
  })

  it('clicar em Configuracoes abre menu de avatar', async () => {
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: /Configuracoes/ }))
    expect(screen.getByText('URL da foto')).toBeInTheDocument()
  })

  it('clicar em Logout chama logoutSession e onLogout', async () => {
    vi.mocked(logoutSession).mockResolvedValue(undefined)
    const onLogout = vi.fn()
    renderLayout(undefined, onLogout)

    await userEvent.click(screen.getByRole('button', { name: /Configuracoes/ }))
    await userEvent.click(screen.getByRole('button', { name: /Logout/ }))

    await waitFor(() => {
      expect(logoutSession).toHaveBeenCalled()
      expect(onLogout).toHaveBeenCalled()
    })
  })

  it('salvar avatar chama updateMyAvatar com URL digitada', async () => {
    vi.mocked(updateMyAvatar).mockResolvedValue('https://x.com/a.png')
    renderLayout()

    await userEvent.click(screen.getByRole('button', { name: /Configuracoes/ }))
    const input = screen.getByPlaceholderText('https://...')
    await userEvent.type(input, 'https://x.com/a.png')
    await userEvent.click(screen.getByRole('button', { name: /Salvar foto/ }))

    await waitFor(() => {
      expect(updateMyAvatar).toHaveBeenCalledWith('https://x.com/a.png')
    })
  })

  it('mostra erro quando updateMyAvatar lanca', async () => {
    vi.mocked(updateMyAvatar).mockRejectedValue(new Error('URL invalida'))
    renderLayout()

    await userEvent.click(screen.getByRole('button', { name: /Configuracoes/ }))
    await userEvent.type(screen.getByPlaceholderText('https://...'), 'x')
    await userEvent.click(screen.getByRole('button', { name: /Salvar foto/ }))

    expect(await screen.findByText('URL invalida')).toBeInTheDocument()
  })

  it('mostra avatar quando session.avatar_url existe', () => {
    renderLayout({ avatar_url: 'https://x.com/foto.png' })
    const img = screen.getByAltText('Foto de Joao Silva') as HTMLImageElement
    expect(img.src).toBe('https://x.com/foto.png')
  })

  it('persiste sidebar colapsada no localStorage', async () => {
    renderLayout()
    const collapseButton = screen.getByTitle('Recolher menu lateral')
    await userEvent.click(collapseButton)
    expect(localStorage.getItem('dashboard_sidebar_collapsed')).toBe('1')
  })
})
