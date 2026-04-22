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
  professor: string
  professor_avatar_url: string | null
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
  school: string
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

export type ListAdminProjectsParams = {
  limit?: number
  offset?: number
  course?: string | null
  school?: string | null
}

export type PaginatedAdminProjects = {
  items: AdminProjectCard[]
  total: number
}

export type PaginatedAdminProjectHistory = {
  items: AdminProjectHistoryCard[]
  total: number
}

const getTokenOrThrow = () => {
  const token = getStoredSessionToken()
  if (!token) {
    throw new Error('Sessao invalida. Faca login novamente.')
  }
  return token
}

export const listAdminProjectsPage = async (
  params: ListAdminProjectsParams = {},
): Promise<PaginatedAdminProjects> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_list_admin_projects', {
    p_token: token,
    p_limit: params.limit ?? 6,
    p_offset: params.offset ?? 0,
    p_course: params.course?.trim() || null,
    p_school: params.school?.trim() || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as (AdminProjectCard & { total_count?: number })[]

  return {
    items: rows,
    total: Number(rows[0]?.total_count ?? 0),
  }
}

export const listAdminProjects = async (): Promise<AdminProjectCard[]> => {
  const result = await listAdminProjectsPage({ limit: 200, offset: 0 })
  return result.items
}

export const listAdminProjectHistoryPage = async (
  params: ListAdminProjectsParams = {},
): Promise<PaginatedAdminProjectHistory> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_list_admin_project_history', {
    p_token: token,
    p_limit: params.limit ?? 6,
    p_offset: params.offset ?? 0,
    p_course: params.course?.trim() || null,
    p_school: params.school?.trim() || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as (AdminProjectHistoryCard & { total_count?: number })[]

  return {
    items: rows,
    total: Number(rows[0]?.total_count ?? 0),
  }
}

export const listAdminProjectHistory = async (): Promise<AdminProjectHistoryCard[]> => {
  const result = await listAdminProjectHistoryPage({ limit: 200, offset: 0 })
  return result.items
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
