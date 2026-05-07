import { getStoredSessionToken } from '../../auth/appAuth'
import { supabase } from '../../lib/supabase'

export type SuperUserRole = 'user' | 'admin' | 'superadmin'

export type SuperUserRow = {
  id: string
  username: string
  display_name: string
  email: string | null
  role: SuperUserRole
  is_active: boolean
  avatar_url: string | null
  created_at: string
  total_count: number
}

export type SuperHistoryRow = {
  id: string
  title: string
  tipo: 'extensao' | 'disciplina'
  course: string | null
  school: string | null
  period_start: string
  period_end: string
  budget: number
  status: 'rascunho' | 'submetido' | 'em_avaliacao' | 'em_ajustes' | 'aprovado' | 'reprovado'
  professor: string
  reviewer: string | null
  reviewed_at: string | null
  created_at: string
  total_count: number
}

const getTokenOrThrow = () => {
  const token = getStoredSessionToken()
  if (!token) {
    throw new Error('Sessao invalida. Faca login novamente.')
  }
  return token
}

export const listSuperUsers = async (params: {
  role?: SuperUserRole | null
  search?: string
  limit?: number
  offset?: number
}): Promise<{ rows: SuperUserRow[]; total: number }> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_sa_list_users', {
    p_token: token,
    p_role_filter: params.role ?? null,
    p_search: params.search ?? null,
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as SuperUserRow[]
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0
  return { rows, total }
}

export const createSuperUser = async (input: {
  username: string
  display_name: string
  email?: string | null
  role: 'user' | 'admin'
  password?: string | null
}): Promise<SuperUserRow> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_sa_create_user', {
    p_token: token,
    p_username: input.username,
    p_display_name: input.display_name,
    p_email: input.email ?? null,
    p_role: input.role,
    p_password: input.password ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as SuperUserRow
}

export const updateSuperUser = async (input: {
  id: string
  display_name: string
  email?: string | null
  is_active: boolean
}): Promise<SuperUserRow> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_sa_update_user', {
    p_token: token,
    p_user_id: input.id,
    p_display_name: input.display_name,
    p_email: input.email ?? null,
    p_is_active: input.is_active,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as SuperUserRow
}

export const resetSuperUserPassword = async (input: {
  id: string
  password: string
}): Promise<void> => {
  const token = getTokenOrThrow()

  const { error } = await supabase.rpc('app_sa_reset_password', {
    p_token: token,
    p_user_id: input.id,
    p_new_password: input.password,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export const listSuperHistory = async (params: {
  search?: string
  status?: string | null
  limit?: number
  offset?: number
}): Promise<{ rows: SuperHistoryRow[]; total: number }> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_sa_list_all_history', {
    p_token: token,
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
    p_search: params.search ?? null,
    p_status: params.status ?? null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as SuperHistoryRow[]
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0
  return { rows, total }
}
