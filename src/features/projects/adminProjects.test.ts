import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import {
  consumePrefetchedAdminProjects,
  decideAdminProject,
  getAdminProjectDetail,
  listAdminProjectHistory,
  listAdminProjects,
  prefetchAdminProjects,
} from './adminProjects'

const TOKEN_KEY = 'extensao_session_token'
const rpc = vi.mocked(supabase.rpc)

beforeEach(() => {
  rpc.mockReset()
  localStorage.clear()
  // limpa eventual prefetch pendente de teste anterior
  consumePrefetchedAdminProjects()
})

describe('listAdminProjects', () => {
  it('lanca quando nao ha token', async () => {
    await expect(listAdminProjects()).rejects.toThrow(/Sessao invalida/)
  })

  it('chama RPC com token', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: [], error: null } as never)
    await listAdminProjects()
    expect(rpc).toHaveBeenCalledWith('app_list_admin_projects', { p_token: 'tok' })
  })

  it('retorna array vazio quando data e null', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: null, error: null } as never)
    expect(await listAdminProjects()).toEqual([])
  })

  it('propaga erro do RPC', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: null, error: { message: 'falha' } } as never)
    await expect(listAdminProjects()).rejects.toThrow('falha')
  })
})

describe('prefetchAdminProjects + consumePrefetchedAdminProjects', () => {
  it('consume retorna null quando nada foi prefetched', () => {
    expect(consumePrefetchedAdminProjects()).toBeNull()
  })

  it('prefetch armazena promise e consume retorna ela', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: [{ id: 'p1' }], error: null } as never)

    prefetchAdminProjects()
    const promise = consumePrefetchedAdminProjects()
    expect(promise).not.toBeNull()
    await promise // resolve sem rejeitar
    // chamou RPC uma unica vez
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('prefetch consecutivos nao duplicam chamadas', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: [], error: null } as never)
    prefetchAdminProjects()
    prefetchAdminProjects()
    prefetchAdminProjects()
    await consumePrefetchedAdminProjects()
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('apos consume, novo prefetch dispara nova chamada', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: [], error: null } as never)
    prefetchAdminProjects()
    await consumePrefetchedAdminProjects()
    prefetchAdminProjects()
    await consumePrefetchedAdminProjects()
    expect(rpc).toHaveBeenCalledTimes(2)
  })
})

describe('listAdminProjectHistory', () => {
  it('chama RPC e retorna array', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: [{ id: 'h1' }], error: null } as never)
    const result = await listAdminProjectHistory()
    expect(rpc).toHaveBeenCalledWith('app_list_admin_project_history', { p_token: 'tok' })
    expect(result).toHaveLength(1)
  })

  it('retorna [] quando data e null', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: null, error: null } as never)
    expect(await listAdminProjectHistory()).toEqual([])
  })
})

describe('getAdminProjectDetail', () => {
  it('chama RPC com projectId', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: { id: 'p1' }, error: null } as never)
    await getAdminProjectDetail('p1')
    expect(rpc).toHaveBeenCalledWith('app_admin_get_project_detail_v2', {
      p_token: 'tok',
      p_project_id: 'p1',
    })
  })

  it('lanca quando projeto nao encontrado', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: null, error: null } as never)
    await expect(getAdminProjectDetail('p1')).rejects.toThrow('Projeto nao encontrado.')
  })
})

describe('decideAdminProject', () => {
  it('chama RPC com decisao e mensagem trimada', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: { id: 'p1' }, error: null } as never)
    await decideAdminProject('p1', 'aprovado', '  ok  ')
    expect(rpc).toHaveBeenCalledWith('app_admin_decide_project', {
      p_token: 'tok',
      p_project_id: 'p1',
      p_decision: 'aprovado',
      p_admin_message: 'ok',
    })
  })

  it('mensagem vazia vira null', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: { id: 'p1' }, error: null } as never)
    await decideAdminProject('p1', 'reprovado', '   ')
    expect(rpc).toHaveBeenCalledWith(
      'app_admin_decide_project',
      expect.objectContaining({ p_admin_message: null }),
    )
  })

  it('mensagem ausente vira null', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: { id: 'p1' }, error: null } as never)
    await decideAdminProject('p1', 'em_ajustes')
    expect(rpc).toHaveBeenCalledWith(
      'app_admin_decide_project',
      expect.objectContaining({ p_admin_message: null }),
    )
  })

  it('propaga erro', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: null, error: { message: 'falha' } } as never)
    await expect(decideAdminProject('p1', 'aprovado')).rejects.toThrow('falha')
  })
})
