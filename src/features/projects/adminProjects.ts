import { getStoredSessionToken } from '../../auth/appAuth'
import { supabase } from '../../lib/supabase'

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
  period_start: string
  period_end: string
  budget: number
  status: Extract<AdminProjectStatus, 'aprovado' | 'reprovado' | 'em_ajustes'>
  reviewed_at: string | null
}

export type AdminProjectDetail = {
  id: string
  title: string
  professor: string
  professor_avatar_url: string | null
  discipline: string
  course: string
  period_start: string
  period_end: string
  target_audience: string
  budget: number
  description: string
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

export const listAdminProjects = async (): Promise<AdminProjectCard[]> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_list_admin_projects', {
    p_token: token,
  })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as AdminProjectCard[]
}

export const listAdminProjectHistory = async (): Promise<AdminProjectHistoryCard[]> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_list_admin_project_history', {
    p_token: token,
  })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as AdminProjectHistoryCard[]
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
