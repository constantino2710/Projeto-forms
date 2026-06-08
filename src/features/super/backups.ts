import { getStoredSessionToken } from '../../auth/appAuth'
import { supabase } from '../../lib/supabase'

export type SnapshotTableInfo = {
  table_name: string
  row_count: number
}

export type TriggerSource =
  | 'pg_cron'
  | 'manual_ui'
  | 'github_workflow'
  | 'manual_sql'
  | 'unknown'

export type SnapshotRun = {
  snapshot_run_id: string
  snapshot_started_at: string
  trigger_source: TriggerSource
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
  last_snapshot_at: string | null
  total_runs: number
}

const getTokenOrThrow = () => {
  const token = getStoredSessionToken()
  if (!token) throw new Error('Sessão inválida. Faça login novamente.')
  return token
}

export const listSnapshots = async (): Promise<SnapshotRun[]> => {
  const token = getTokenOrThrow()
  const { data, error } = await supabase.rpc('app_sa_list_snapshots', { p_token: token })
  if (error) throw new Error(error.message)
  return (data ?? []) as SnapshotRun[]
}

export const triggerSnapshot = async (): Promise<unknown> => {
  const token = getTokenOrThrow()
  const { data, error } = await supabase.rpc('app_sa_trigger_snapshot', { p_token: token })
  if (error) throw new Error(error.message)
  return data
}

export const restoreTable = async (runId: string, tableName: string): Promise<unknown> => {
  const token = getTokenOrThrow()
  const { data, error } = await supabase.rpc('app_sa_restore_table', {
    p_token: token,
    p_run_id: runId,
    p_table_name: tableName,
  })
  if (error) throw new Error(error.message)
  return data
}

export const restoreAll = async (runId: string): Promise<unknown> => {
  const token = getTokenOrThrow()
  const { data, error } = await supabase.rpc('app_sa_restore_all', {
    p_token: token,
    p_run_id: runId,
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
