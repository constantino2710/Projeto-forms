import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginPage } from './LoginPage'
import { login } from '../auth/appAuth'
import type { AuthSession } from '../App'

vi.mock('../auth/appAuth', () => ({
  login: vi.fn(),
}))

const mockSession: AuthSession = {
  token: 'tok-123',
  user_id: 'u-1',
  username: 'joao',
  display_name: 'Joao',
  avatar_url: null,
  role: 'user',
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.mocked(login).mockReset()
  })

  it('renderiza campos de usuario e senha', () => {
    render(<LoginPage onLogin={vi.fn()} />)
    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('campos obrigatorios marcados como required', () => {
    render(<LoginPage onLogin={vi.fn()} />)
    expect(screen.getByLabelText('Usuario')).toBeRequired()
    expect(screen.getByLabelText('Senha')).toBeRequired()
  })

  it('botao olhinho alterna type="password" e type="text"', async () => {
    render(<LoginPage onLogin={vi.fn()} />)
    const senha = screen.getByLabelText('Senha') as HTMLInputElement
    expect(senha.type).toBe('password')

    const toggle = screen.getByRole('button', { name: 'Mostrar senha' })
    await userEvent.click(toggle)
    expect(senha.type).toBe('text')

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(senha.type).toBe('password')
  })

  it('chama login com username/password ao submeter', async () => {
    vi.mocked(login).mockResolvedValue(mockSession)
    const onLogin = vi.fn()
    render(<LoginPage onLogin={onLogin} />)

    await userEvent.type(screen.getByLabelText('Usuario'), 'joao')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('joao', 'segredo')
    })
  })

  it('chama onLogin com a sessao ao sucesso', async () => {
    vi.mocked(login).mockResolvedValue(mockSession)
    const onLogin = vi.fn()
    render(<LoginPage onLogin={onLogin} />)

    await userEvent.type(screen.getByLabelText('Usuario'), 'joao')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith(mockSession)
    })
  })

  it('mostra mensagem de erro quando login lanca', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Usuario nao encontrado.'))
    render(<LoginPage onLogin={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Usuario'), 'joao')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Usuario nao encontrado.')).toBeInTheDocument()
  })

  it('mostra "Entrando..." durante o submit', async () => {
    let resolveLogin: (value: AuthSession) => void = () => {}
    vi.mocked(login).mockImplementation(
      () =>
        new Promise<AuthSession>((resolve) => {
          resolveLogin = resolve
        }),
    )
    render(<LoginPage onLogin={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Usuario'), 'joao')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('button', { name: 'Entrando...' })).toBeDisabled()
    resolveLogin(mockSession)
  })

  it('limpa erro antigo ao digitar usuario de novo', async () => {
    vi.mocked(login).mockRejectedValue(new Error('Senha invalida.'))
    render(<LoginPage onLogin={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('Usuario'), 'joao')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Senha invalida.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Usuario'), 'x')
    expect(screen.queryByText('Senha invalida.')).not.toBeInTheDocument()
  })
})
