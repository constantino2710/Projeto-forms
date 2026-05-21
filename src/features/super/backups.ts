import { getStoredSessionToken } from '../../auth/appAuth'
import { supabase } from '../../lib/supabase'

export type SnapshotTableInfo = {
  table_name: string
  row_count: number
  created_at: string
}

export type SnapshotGroup = {
  snapshot_date: string
  table_count: number
  total_rows: number
  tables: SnapshotTableInfo[]
}

export type RestoreAuditEntry = {
  id: string
  performed_by_username: string
  action: 'snapshot' | 'restore_table' | 'restore_all'
  table_name: string | null
  snapshot_date: string | null
  rows_before: number | null
  rows_after: number | null
  success: boolean
  error_message: string | null
  performed_at: string
}

export type BackupSchedule = {
  now_utc: string
  next_internal_snapshot_utc: string
  next_external_dump_utc: string
  last_snapshot_date: string | null
}

const getTokenOrThrow = () => {
  const token = getStoredSessionToken()
  if (!token) throw new Error('Sessao invalida. Faca login novamente.')
  return token
}

export const listSnapshots = async (): Promise<SnapshotGroup[]> => {
  const token = getTokenOrThrow()
  const { data, error } = await supabase.rpc('app_sa_list_snapshots', { p_token: token })
  if (error) throw new Error(error.message)
  return (data ?? []) as SnapshotGroup[]
}

export const triggerSnapshot = async (): Promise<unknown> => {
  const token = getTokenOrThrow()
  const { data, error } = await supabase.rpc('app_sa_trigger_snapshot', { p_token: token })
  if (error) throw new Error(error.message)
  return data
}

export const restoreTable = async (
  tableName: string,
  snapshotDate: string,
): Promise<unknown> => {
  const token = getTokenOrThrow()
  const { data, error } = await supabase.rpc('app_sa_restore_table', {
    p_token: token,
    p_table_name: tableName,
    p_snapshot_date: snapshotDate,
  })
  if (error) throw new Error(error.message)
  return data
}

export const restoreAll = async (snapshotDate: string): Promise<unknown> => {
  const token = getTokenOrThrow()
  const { data, error } = await supabase.rpc('app_sa_restore_all', {
    p_token: token,
    p_snapshot_date: snapshotDate,
  })
  if (error) throw new Error(error.message)
  return data
}

export const getBackupSchedule = async (): Promise<BackupSchedule> => {
  const token = getTokenOrThrow()
  const { data, error } = await supabase.rpc('app_sa_next_backup_schedule', {
    p_token: token,
  })
  if (error) throw new Error(error.message)
  return data as BackupSchedule
}

export const listRestoreAudit = async (limit = 20): Promise<RestoreAuditEntry[]> => {
  const token = getTokenOrThrow()
  const { data, error } = await supabase.rpc('app_sa_list_restore_audit', {
    p_token: token,
    p_limit: limit,
  })
  if (error) throw new Error(error.message)
  return (data ?? []) as RestoreAuditEntry[]
}
