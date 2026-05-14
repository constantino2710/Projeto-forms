import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import {
  createSuperUser,
  deleteSuperUser,
  listSuperHistory,
  listSuperUsers,
  resetSuperUserPassword,
  updateSuperUser,
} from './superAdmin'

const TOKEN_KEY = 'extensao_session_token'
const rpc = vi.mocked(supabase.rpc)

const setToken = () => localStorage.setItem(TOKEN_KEY, 'tok')

beforeEach(() => {
  rpc.mockReset()
  localStorage.clear()
})

describe('listSuperUsers', () => {
  it('lanca quando nao ha token', async () => {
    await expect(listSuperUsers({})).rejects.toThrow(/Sessao invalida/)
  })

  it('passa filtros e defaults para o RPC', async () => {
    setToken()
    rpc.mockResolvedValue({ data: [], error: null } as never)
    await listSuperUsers({})
    expect(rpc).toHaveBeenCalledWith('app_sa_list_users', {
      p_token: 'tok',
      p_role_filter: null,
      p_search: null,
      p_limit: 20,
      p_offset: 0,
    })
  })

  it('passa filtros customizados', async () => {
    setToken()
    rpc.mockResolvedValue({ data: [], error: null } as never)
    await listSuperUsers({ role: 'admin', search: 'foo', limit: 50, offset: 10 })
    expect(rpc).toHaveBeenCalledWith('app_sa_list_users', {
      p_token: 'tok',
      p_role_filter: 'admin',
      p_search: 'foo',
      p_limit: 50,
      p_offset: 10,
    })
  })

  it('calcula total da primeira linha', async () => {
    setToken()
    rpc.mockResolvedValue({
      data: [
        { id: '1', total_count: 42 },
        { id: '2', total_count: 42 },
      ],
      error: null,
    } as never)
    const { rows, total } = await listSuperUsers({})
    expect(rows).toHaveLength(2)
    expect(total).toBe(42)
  })

  it('retorna total 0 quando nao ha linhas', async () => {
    setToken()
    rpc.mockResolvedValue({ data: [], error: null } as never)
    const { total } = await listSuperUsers({})
    expect(total).toBe(0)
  })

  it('propaga erro', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: { message: 'x' } } as never)
    await expect(listSuperUsers({})).rejects.toThrow('x')
  })
})

describe('createSuperUser', () => {
  it('chama RPC com campos mapeados', async () => {
    setToken()
    rpc.mockResolvedValue({ data: { id: 'u1' }, error: null } as never)
    await createSuperUser({
      username: 'joao',
      display_name: 'Joao',
      email: 'joao@x.com',
      role: 'user',
      password: 'segredo',
    })
    expect(rpc).toHaveBeenCalledWith('app_sa_create_user', {
      p_token: 'tok',
      p_username: 'joao',
      p_display_name: 'Joao',
      p_email: 'joao@x.com',
      p_role: 'user',
      p_password: 'segredo',
    })
  })

  it('email e password ausentes viram null', async () => {
    setToken()
    rpc.mockResolvedValue({ data: { id: 'u1' }, error: null } as never)
    await createSuperUser({ username: 'a', display_name: 'A', role: 'admin' })
    expect(rpc).toHaveBeenCalledWith(
      'app_sa_create_user',
      expect.objectContaining({ p_email: null, p_password: null }),
    )
  })
})

describe('updateSuperUser', () => {
  it('chama RPC com campos mapeados', async () => {
    setToken()
    rpc.mockResolvedValue({ data: { id: 'u1' }, error: null } as never)
    await updateSuperUser({
      id: 'u1',
      display_name: 'Novo Nome',
      email: 'n@x.com',
      is_active: false,
    })
    expect(rpc).toHaveBeenCalledWith('app_sa_update_user', {
      p_token: 'tok',
      p_user_id: 'u1',
      p_display_name: 'Novo Nome',
      p_email: 'n@x.com',
      p_is_active: false,
    })
  })

  it('email opcional ausente vira null', async () => {
    setToken()
    rpc.mockResolvedValue({ data: { id: 'u1' }, error: null } as never)
    await updateSuperUser({ id: 'u1', display_name: 'X', is_active: true })
    expect(rpc).toHaveBeenCalledWith(
      'app_sa_update_user',
      expect.objectContaining({ p_email: null }),
    )
  })
})

describe('resetSuperUserPassword', () => {
  it('chama RPC com nova senha', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: null } as never)
    await resetSuperUserPassword({ id: 'u1', password: 'novaSenha' })
    expect(rpc).toHaveBeenCalledWith('app_sa_reset_password', {
      p_token: 'tok',
      p_user_id: 'u1',
      p_new_password: 'novaSenha',
    })
  })

  it('propaga erro', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: { message: 'falha' } } as never)
    await expect(resetSuperUserPassword({ id: 'u1', password: 'x' })).rejects.toThrow('falha')
  })
})

describe('deleteSuperUser', () => {
  it('chama RPC com user id', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: null } as never)
    await deleteSuperUser({ id: 'u1' })
    expect(rpc).toHaveBeenCalledWith('app_sa_delete_user', {
      p_token: 'tok',
      p_user_id: 'u1',
    })
  })

  it('propaga erro', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: { message: 'x' } } as never)
    await expect(deleteSuperUser({ id: 'u1' })).rejects.toThrow('x')
  })
})

describe('listSuperHistory', () => {
  it('passa defaults', async () => {
    setToken()
    rpc.mockResolvedValue({ data: [], error: null } as never)
    await listSuperHistory({})
    expect(rpc).toHaveBeenCalledWith('app_sa_list_all_history', {
      p_token: 'tok',
      p_limit: 20,
      p_offset: 0,
      p_search: null,
      p_status: null,
    })
  })

  it('passa filtros customizados', async () => {
    setToken()
    rpc.mockResolvedValue({ data: [], error: null } as never)
    await listSuperHistory({ search: 'x', status: 'aprovado', limit: 100, offset: 5 })
    expect(rpc).toHaveBeenCalledWith('app_sa_list_all_history', {
      p_token: 'tok',
      p_limit: 100,
      p_offset: 5,
      p_search: 'x',
      p_status: 'aprovado',
    })
  })

  it('calcula total da primeira linha', async () => {
    setToken()
    rpc.mockResolvedValue({
      data: [{ id: '1', total_count: 7 }],
      error: null,
    } as never)
    const { total } = await listSuperHistory({})
    expect(total).toBe(7)
  })

  it('total 0 quando lista vazia', async () => {
    setToken()
    rpc.mockResolvedValue({ data: [], error: null } as never)
    const { total } = await listSuperHistory({})
    expect(total).toBe(0)
  })
})
