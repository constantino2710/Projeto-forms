import { getStoredSessionToken } from '../../auth/appAuth'
import { supabase } from '../../lib/supabase'
import type { ExtensionPlanData } from './extensionPlan'

export type AdminProjectStatus =
  | 'rascunho'
  | 'submetido'
  | 'em_avaliacao'
  | 'em_ajustes'
  | 'aprovado'
  | 'reprovado'

export type AdminProjectCard = {
  id: string
  title: string
  tipo: 'extensao' | 'disciplina'
  course: string | null
  school: string | null
  period_start: string
  period_end: string
  budget: number
  status: AdminProjectStatus
  created_at: string
}

export type AdminProjectHistoryCard = {
  id: string
  title: string
  tipo: 'extensao' | 'disciplina'
  course: string | null
  school: string | null
  period_start: string
  period_end: string
  budget: number
  status: Extract<AdminProjectStatus, 'aprovado' | 'reprovado' | 'em_ajustes'>
  reviewed_at: string | null
}

export type AdminProjectDetail = {
  id: string
  title: string
  tipo: 'extensao' | 'disciplina'
  professor: string
  professor_avatar_url: string | null
  discipline: string
  course: string
  period_start: string
  period_end: string
  target_audience: string
  budget: number
  description: string
  extension_form?: ExtensionPlanData | null
  status: AdminProjectStatus
  created_at: string
  updated_at: string
}

export type AdminProjectDecisionResult = {
  id: string
  status: Extract<AdminProjectStatus, 'aprovado' | 'reprovado' | 'em_ajustes'>
  updated_at: string
  project_title: string
  professor_name: string | null
  recipient_email: string | null
  admin_message: string | null
}

const getTokenOrThrow = () => {
  const token = getStoredSessionToken()
  if (!token) {
    throw new Error('Sessao invalida. Faca login novamente.')
  }
  return token
}

type ListAdminProjectsParams = {
  limit?: number
  offset?: number
  query?: string | null
  statuses?: string[] | null
  course?: string | null
  school?: string | null
  sortKey?: string | null
  sortDir?: string | null
}

type ListAdminProjectsRow = AdminProjectCard & { total_count: number }
type ListAdminProjectHistoryRow = AdminProjectHistoryCard & { total_count: number }

export const listAdminProjects = async (
  params: ListAdminProjectsParams = {},
): Promise<{ rows: AdminProjectCard[]; total: number }> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_list_admin_projects', {
    p_token: token,
    p_limit: params.limit ?? 200,
    p_offset: params.offset ?? 0,
    p_course: params.course ?? null,
    p_school: params.school ?? null,
    p_sort_key: params.sortKey ?? null,
    p_sort_dir: params.sortDir ?? null,
    p_query: params.query ?? null,
    p_statuses:
      params.statuses && params.statuses.length > 0 ? params.statuses : null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as ListAdminProjectsRow[]
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0
  return { rows: rows as AdminProjectCard[], total }
}

let pendingAdminProjectsPrefetch: Promise<{ rows: AdminProjectCard[]; total: number }> | null = null

export const prefetchAdminProjects = (): void => {
  if (pendingAdminProjectsPrefetch) {
    return
  }
  pendingAdminProjectsPrefetch = listAdminProjects({ limit: 9, offset: 0 }).catch((err) => {
    pendingAdminProjectsPrefetch = null
    throw err
  })
}

export const consumePrefetchedAdminProjects = (): Promise<{
  rows: AdminProjectCard[]
  total: number
}> | null => {
  const promise = pendingAdminProjectsPrefetch
  pendingAdminProjectsPrefetch = null
  return promise
}

export const listAdminProjectHistory = async (
  params: ListAdminProjectsParams = {},
): Promise<{ rows: AdminProjectHistoryCard[]; total: number }> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_list_admin_project_history', {
    p_token: token,
    p_limit: params.limit ?? 200,
    p_offset: params.offset ?? 0,
    p_course: params.course ?? null,
    p_school: params.school ?? null,
    p_sort_key: params.sortKey ?? null,
    p_sort_dir: params.sortDir ?? null,
    p_query: params.query ?? null,
    p_statuses:
      params.statuses && params.statuses.length > 0 ? params.statuses : null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as ListAdminProjectHistoryRow[]
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0
  return { rows: rows as AdminProjectHistoryCard[], total }
}

let pendingAdminProjectHistoryPrefetch: Promise<{
  rows: AdminProjectHistoryCard[]
  total: number
}> | null = null

export const prefetchAdminProjectHistory = (): void => {
  if (pendingAdminProjectHistoryPrefetch) {
    return
  }
  pendingAdminProjectHistoryPrefetch = listAdminProjectHistory({ limit: 9, offset: 0 }).catch((err) => {
    pendingAdminProjectHistoryPrefetch = null
    throw err
  })
}

export const consumePrefetchedAdminProjectHistory = (): Promise<{
  rows: AdminProjectHistoryCard[]
  total: number
}> | null => {
  const promise = pendingAdminProjectHistoryPrefetch
  pendingAdminProjectHistoryPrefetch = null
  return promise
}

export const getAdminProjectDetail = async (projectId: string): Promise<AdminProjectDetail> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_admin_get_project_detail_v2', {
    p_token: token,
    p_project_id: projectId,
  })

  if (error) {
    throw new Error(error.message)
  }

  const project = data as AdminProjectDetail | null
  if (!project) {
    throw new Error('Projeto nao encontrado.')
  }

  return project
}

export const decideAdminProject = async (
  projectId: string,
  decision: Extract<AdminProjectStatus, 'aprovado' | 'reprovado' | 'em_ajustes'>,
  adminMessage?: string,
): Promise<AdminProjectDecisionResult> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_admin_decide_project', {
    p_token: token,
    p_project_id: projectId,
    p_decision: decision,
    p_admin_message: adminMessage?.trim() || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data as AdminProjectDecisionResult
}
