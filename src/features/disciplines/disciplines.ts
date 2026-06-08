import { getStoredSessionToken } from '../../auth/appAuth'
import { supabase } from '../../lib/supabase'

export type DisciplineRow = {
  id: string
  codigo: string
  disciplina: string
  curso: string
  docente: string
  periodo: string
  carga_horaria: string
  codigo_disciplina: string
  codigo_turma: string
  disciplina_gerencial: boolean
  cursos_gerenciados: string | null
}

export type SuperDisciplineRow = DisciplineRow & {
  created_at: string
  updated_at: string
  total_count: number
}

export type DisciplineImportRow = {
  codigo: string
  disciplina: string
  curso: string
  docente: string
  periodo: string
  carga_horaria: string
  codigo_disciplina: string
  codigo_turma: string
  disciplina_gerencial: boolean
  cursos_gerenciados: string
}

const getTokenOrThrow = () => {
  const token = getStoredSessionToken()
  if (!token) {
    throw new Error('Sessão inválida. Faça login novamente.')
  }
  return token
}

type SupabaseRpcError = {
  message?: string
  details?: string | null
  hint?: string | null
  code?: string | null
}

const throwRpcError = (context: string, error: SupabaseRpcError): never => {
  const parts = [error.message, error.details, error.hint]
    .filter((part): part is string => Boolean(part && part.trim()))
  const code = error.code ? `[${error.code}] ` : ''
  const fullMessage = `${context}: ${code}${parts.join(' — ') || 'erro desconhecido'}`

  console.error(`[disciplines] ${context}`, {
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  })

  throw new Error(fullMessage)
}

export const listDisciplines = async (): Promise<DisciplineRow[]> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_list_disciplines', {
    p_token: token,
  })

  if (error) {
    throwRpcError('Falha ao listar disciplinas', error)
  }

  return (data ?? []) as DisciplineRow[]
}

export const listAdminDisciplines = async (params: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ rows: SuperDisciplineRow[]; total: number }> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_sa_list_disciplines', {
    p_token: token,
    p_search: params.search ?? null,
    p_limit: params.limit ?? 20,
    p_offset: params.offset ?? 0,
  })

  if (error) {
    throwRpcError('Falha ao listar catálogo', error)
  }

  const rows = (data ?? []) as SuperDisciplineRow[]
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0
  return { rows, total }
}

export const replaceDisciplines = async (
  rows: DisciplineImportRow[],
): Promise<{ inserted: number }> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_sa_replace_disciplines', {
    p_token: token,
    p_rows: rows,
  })

  if (error) {
    throwRpcError('Falha ao substituir catálogo', error)
  }

  return data as { inserted: number }
}

export const upsertDisciplines = async (
  rows: DisciplineImportRow[],
): Promise<{ affected: number }> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_sa_upsert_disciplines', {
    p_token: token,
    p_rows: rows,
  })

  if (error) {
    throwRpcError('Falha ao mesclar catálogo', error)
  }

  return data as { affected: number }
}

export const clearDisciplines = async (): Promise<{ deleted: number }> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.rpc('app_sa_clear_disciplines', {
    p_token: token,
  })

  if (error) {
    throwRpcError('Falha ao limpar catálogo', error)
  }

  return data as { deleted: number }
}
