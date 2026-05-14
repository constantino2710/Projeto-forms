import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase } from '../lib/supabase'
import {
  clearSessionToken,
  getStoredSessionRole,
  getStoredSessionToken,
  login,
  logoutSession,
  updateMyAvatar,
  validateSession,
} from './appAuth'

const TOKEN_KEY = 'extensao_session_token'
const ROLE_KEY = 'extensao_session_role'

const sessionPayload = {
  token: 'tok-123',
  user_id: 'u-1',
  username: 'joao',
  display_name: 'Joao',
  avatar_url: null,
  role: 'user' as const,
}

const rpc = vi.mocked(supabase.rpc)

beforeEach(() => {
  rpc.mockReset()
  localStorage.clear()
})

describe('getStoredSessionToken', () => {
  it('retorna null quando nao ha token', () => {
    expect(getStoredSessionToken()).toBeNull()
  })

  it('retorna o token armazenado', () => {
    localStorage.setItem(TOKEN_KEY, 'abc')
    expect(getStoredSessionToken()).toBe('abc')
  })
})

describe('getStoredSessionRole', () => {
  it('retorna null quando nao ha role', () => {
    expect(getStoredSessionRole()).toBeNull()
  })

  it('aceita admin, user e superadmin', () => {
    localStorage.setItem(ROLE_KEY, 'admin')
    expect(getStoredSessionRole()).toBe('admin')
    localStorage.setItem(ROLE_KEY, 'user')
    expect(getStoredSessionRole()).toBe('user')
    localStorage.setItem(ROLE_KEY, 'superadmin')
    expect(getStoredSessionRole()).toBe('superadmin')
  })

  it('retorna null para role invalido', () => {
    localStorage.setItem(ROLE_KEY, 'banana')
    expect(getStoredSessionRole()).toBeNull()
  })
})

describe('clearSessionToken', () => {
  it('remove token e role do localStorage', () => {
    localStorage.setItem(TOKEN_KEY, 'abc')
    localStorage.setItem(ROLE_KEY, 'user')
    clearSessionToken()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(ROLE_KEY)).toBeNull()
  })
})

describe('login', () => {
  it('chama rpc app_login com username sem espacos', async () => {
    rpc.mockResolvedValue({ data: sessionPayload, error: null } as never)
    await login('  joao  ', 'segredo')
    expect(rpc).toHaveBeenCalledWith('app_login', {
      p_username: 'joao',
      p_password: 'segredo',
    })
  })

  it('em sucesso salva token e role e retorna sessao', async () => {
    rpc.mockResolvedValue({ data: sessionPayload, error: null } as never)
    const session = await login('joao', 'segredo')
    expect(session.token).toBe('tok-123')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('tok-123')
    expect(localStorage.getItem(ROLE_KEY)).toBe('user')
  })

  it('avatar_url ausente vira null', async () => {
    rpc.mockResolvedValue({
      data: { ...sessionPayload, avatar_url: undefined },
      error: null,
    } as never)
    const session = await login('joao', 'segredo')
    expect(session.avatar_url).toBeNull()
  })

  it('mapeia "Usuario nao encontrado" do erro RPC', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'PG: Usuario nao encontrado' },
    } as never)
    await expect(login('x', 'y')).rejects.toThrow('Usuario nao encontrado.')
  })

  it('mapeia "Senha invalida"', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'PG: Senha invalida' },
    } as never)
    await expect(login('x', 'y')).rejects.toThrow('Senha invalida.')
  })

  it('mapeia "Failed to fetch" para mensagem de conexao com Supabase', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch' },
    } as never)
    await expect(login('x', 'y')).rejects.toThrow(/conectar com o Supabase/)
  })

  it('lanca quando role retornado e invalido', async () => {
    rpc.mockResolvedValue({
      data: { ...sessionPayload, role: 'banana' },
      error: null,
    } as never)
    await expect(login('x', 'y')).rejects.toThrow('Sessao invalida recebida do servidor.')
  })

  it('lanca quando data e null', async () => {
    rpc.mockResolvedValue({ data: null, error: null } as never)
    await expect(login('x', 'y')).rejects.toThrow('Sessao invalida recebida do servidor.')
  })
})

describe('validateSession', () => {
  it('retorna sessao e salva role quando RPC responde com data', async () => {
    rpc.mockResolvedValue({ data: sessionPayload, error: null } as never)
    const session = await validateSession('tok-123')
    expect(session?.token).toBe('tok-123')
    expect(localStorage.getItem(ROLE_KEY)).toBe('user')
  })

  it('retorna null quando RPC responde com data null', async () => {
    rpc.mockResolvedValue({ data: null, error: null } as never)
    const session = await validateSession('tok-123')
    expect(session).toBeNull()
  })

  it('lanca erro mapeado se RPC retornar erro', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'NetworkError' },
    } as never)
    await expect(validateSession('tok-123')).rejects.toThrow(/conectar com o Supabase/)
  })
})

describe('logoutSession', () => {
  it('nao chama RPC quando nao ha token', async () => {
    await logoutSession()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('chama app_logout com o token armazenado', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok-abc')
    rpc.mockResolvedValue({ data: null, error: null } as never)
    await logoutSession()
    expect(rpc).toHaveBeenCalledWith('app_logout', { p_token: 'tok-abc' })
  })
})

describe('updateMyAvatar', () => {
  it('lanca erro quando nao ha token', async () => {
    await expect(updateMyAvatar('https://...')).rejects.toThrow('Sessao invalida')
  })

  it('chama RPC com url e retorna avatar_url', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok-abc')
    rpc.mockResolvedValue({
      data: { avatar_url: 'https://x.com/a.png' },
      error: null,
    } as never)
    const result = await updateMyAvatar('https://x.com/a.png')
    expect(result).toBe('https://x.com/a.png')
    expect(rpc).toHaveBeenCalledWith('app_update_my_avatar', {
      p_token: 'tok-abc',
      p_avatar_url: 'https://x.com/a.png',
    })
  })

  it('passa null quando avatar e string vazia', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok-abc')
    rpc.mockResolvedValue({ data: { avatar_url: null }, error: null } as never)
    await updateMyAvatar('   ')
    expect(rpc).toHaveBeenCalledWith('app_update_my_avatar', {
      p_token: 'tok-abc',
      p_avatar_url: null,
    })
  })

  it('lanca erro mapeado se RPC retornar erro', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok-abc')
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Failed to fetch' },
    } as never)
    await expect(updateMyAvatar('x')).rejects.toThrow(/conectar com o Supabase/)
  })
})
