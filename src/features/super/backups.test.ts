import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import {
  getBackupSchedule,
  listRestoreAudit,
  listSnapshots,
  restoreAll,
  restoreTable,
  triggerSnapshot,
} from './backups'

const TOKEN_KEY = 'extensao_session_token'
const rpc = vi.mocked(supabase.rpc)

const setToken = () => localStorage.setItem(TOKEN_KEY, 'tok')

beforeEach(() => {
  rpc.mockReset()
  localStorage.clear()
})

describe('listSnapshots', () => {
  it('lanca quando nao ha token', async () => {
    await expect(listSnapshots()).rejects.toThrow(/Sessao invalida/)
  })

  it('chama RPC com token e retorna data', async () => {
    setToken()
    rpc.mockResolvedValue({
      data: [{ snapshot_run_id: 'r1', table_count: 12, total_rows: 100, tables: [] }],
      error: null,
    } as never)
    const result = await listSnapshots()
    expect(rpc).toHaveBeenCalledWith('app_sa_list_snapshots', { p_token: 'tok' })
    expect(result).toHaveLength(1)
  })

  it('retorna [] quando data e null', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: null } as never)
    expect(await listSnapshots()).toEqual([])
  })

  it('propaga erro', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: { message: 'falha snap' } } as never)
    await expect(listSnapshots()).rejects.toThrow('falha snap')
  })
})

describe('triggerSnapshot', () => {
  it('lanca quando nao ha token', async () => {
    await expect(triggerSnapshot()).rejects.toThrow(/Sessao invalida/)
  })

  it('chama RPC com token', async () => {
    setToken()
    rpc.mockResolvedValue({ data: { snapshot_run_id: 'r1' }, error: null } as never)
    await triggerSnapshot()
    expect(rpc).toHaveBeenCalledWith('app_sa_trigger_snapshot', { p_token: 'tok' })
  })

  it('propaga erro', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: { message: 'falha trigger' } } as never)
    await expect(triggerSnapshot()).rejects.toThrow('falha trigger')
  })
})

describe('restoreTable', () => {
  it('lanca quando nao ha token', async () => {
    await expect(restoreTable('r', 't')).rejects.toThrow(/Sessao invalida/)
  })

  it('chama RPC com run_id e table_name', async () => {
    setToken()
    rpc.mockResolvedValue({ data: { rows_after: 5 }, error: null } as never)
    await restoreTable('run-1', 'app_users')
    expect(rpc).toHaveBeenCalledWith('app_sa_restore_table', {
      p_token: 'tok',
      p_run_id: 'run-1',
      p_table_name: 'app_users',
    })
  })

  it('propaga erro', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: { message: 'falha rest' } } as never)
    await expect(restoreTable('r', 't')).rejects.toThrow('falha rest')
  })
})

describe('restoreAll', () => {
  it('lanca quando nao ha token', async () => {
    await expect(restoreAll('r')).rejects.toThrow(/Sessao invalida/)
  })

  it('chama RPC com run_id', async () => {
    setToken()
    rpc.mockResolvedValue({ data: { tables_restored: 12 }, error: null } as never)
    await restoreAll('run-1')
    expect(rpc).toHaveBeenCalledWith('app_sa_restore_all', {
      p_token: 'tok',
      p_run_id: 'run-1',
    })
  })

  it('propaga erro', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: { message: 'falha all' } } as never)
    await expect(restoreAll('r')).rejects.toThrow('falha all')
  })
})

describe('getBackupSchedule', () => {
  it('lanca quando nao ha token', async () => {
    await expect(getBackupSchedule()).rejects.toThrow(/Sessao invalida/)
  })

  it('chama RPC e retorna o objeto', async () => {
    setToken()
    const sched = {
      now_utc: '2026-05-21T12:00:00Z',
      next_internal_snapshot_utc: '2026-05-25T03:00:00Z',
      next_external_dump_utc: '2026-05-25T04:00:00Z',
      last_snapshot_at: null,
      total_runs: 0,
    }
    rpc.mockResolvedValue({ data: sched, error: null } as never)
    expect(await getBackupSchedule()).toEqual(sched)
    expect(rpc).toHaveBeenCalledWith('app_sa_next_backup_schedule', { p_token: 'tok' })
  })

  it('propaga erro', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: { message: 'falha sched' } } as never)
    await expect(getBackupSchedule()).rejects.toThrow('falha sched')
  })
})

describe('listRestoreAudit', () => {
  it('lanca quando nao ha token', async () => {
    await expect(listRestoreAudit()).rejects.toThrow(/Sessao invalida/)
  })

  it('passa limit default 20', async () => {
    setToken()
    rpc.mockResolvedValue({ data: [], error: null } as never)
    await listRestoreAudit()
    expect(rpc).toHaveBeenCalledWith('app_sa_list_restore_audit', {
      p_token: 'tok',
      p_limit: 20,
    })
  })

  it('passa limit customizado', async () => {
    setToken()
    rpc.mockResolvedValue({ data: [], error: null } as never)
    await listRestoreAudit(50)
    expect(rpc).toHaveBeenCalledWith('app_sa_list_restore_audit', {
      p_token: 'tok',
      p_limit: 50,
    })
  })

  it('retorna [] quando data e null', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: null } as never)
    expect(await listRestoreAudit()).toEqual([])
  })

  it('propaga erro', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: { message: 'falha audit' } } as never)
    await expect(listRestoreAudit()).rejects.toThrow('falha audit')
  })
})
