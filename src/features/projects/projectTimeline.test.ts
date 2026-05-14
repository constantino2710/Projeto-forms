import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import { getProjectTimeline } from './projectTimeline'

const TOKEN_KEY = 'extensao_session_token'
const rpc = vi.mocked(supabase.rpc)

beforeEach(() => {
  rpc.mockReset()
  localStorage.clear()
})

describe('getProjectTimeline', () => {
  const timeline = {
    status: 'aprovado' as const,
    created_at: '2025-01-01',
    submitted_at: '2025-01-02',
    analysis_started_at: '2025-01-03',
    approved_at: '2025-01-04',
    rejected_at: null,
  }

  it('lanca quando nao ha token', async () => {
    await expect(getProjectTimeline('p1')).rejects.toThrow(/Sessao invalida/)
  })

  it('chama RPC com token e projectId', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: timeline, error: null } as never)
    await getProjectTimeline('p1')
    expect(rpc).toHaveBeenCalledWith('app_get_project_timeline', {
      p_token: 'tok',
      p_project_id: 'p1',
    })
  })

  it('retorna timeline do RPC', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: timeline, error: null } as never)
    const result = await getProjectTimeline('p1')
    expect(result).toEqual(timeline)
  })

  it('lanca erro mapeado quando RPC retorna erro', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: null, error: { message: 'falha' } } as never)
    await expect(getProjectTimeline('p1')).rejects.toThrow('falha')
  })

  it('lanca "Nao foi possivel carregar" quando data e null', async () => {
    localStorage.setItem(TOKEN_KEY, 'tok')
    rpc.mockResolvedValue({ data: null, error: null } as never)
    await expect(getProjectTimeline('p1')).rejects.toThrow(/Nao foi possivel carregar/)
  })
})
