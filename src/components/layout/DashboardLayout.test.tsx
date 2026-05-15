import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import { DashboardLayout } from './DashboardLayout'
import { logoutSession } from '../../auth/appAuth'
import type { AuthSession } from '../../App'

vi.mock('../../auth/appAuth', () => ({
  logoutSession: vi.fn(),
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

const renderLayout = (
  override?: Partial<AuthSession>,
  onLogout = vi.fn(),
  onSessionUpdate = vi.fn(),
) =>
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
              onSessionUpdate={onSessionUpdate}
            />
          }
        >
          <Route path="meus-projetos" element={<p>Pagina filha</p>} />
          <Route path="configuracoes" element={<p>Pagina configuracoes</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.mocked(logoutSession).mockReset()
    localStorage.clear()
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

  it('clicar em Configuracoes navega para a pagina de configuracoes', async () => {
    renderLayout()
    await userEvent.click(screen.getByRole('link', { name: /Configuracoes/ }))
    expect(await screen.findByText('Pagina configuracoes')).toBeInTheDocument()
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
