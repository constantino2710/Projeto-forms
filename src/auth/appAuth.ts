import type { AuthRole, AuthSession } from '../App'
import { supabase } from '../lib/supabase'

const SESSION_TOKEN_KEY = 'extensao_session_token'
const SESSION_ROLE_KEY = 'extensao_session_role'

const isAuthRole = (value: string | null): value is AuthRole =>
  value === 'admin' || value === 'user' || value === 'superadmin'

type LoginResponse = {
  token: string
  user_id: string
  username: string
  display_name: string
  avatar_url?: string | null
  role: 'admin' | 'user' | 'superadmin'
}

const parseSession = (value: unknown): AuthSession => {
  const data = value as LoginResponse | null

  if (
    !data ||
    !data.token ||
    !data.user_id ||
    !data.username ||
    !data.display_name ||
    (data.role !== 'admin' && data.role !== 'user' && data.role !== 'superadmin')
  ) {
    throw new Error('Sessao invalida recebida do servidor.')
  }

  return {
    ...data,
    avatar_url: data.avatar_url ?? null,
  }
}

export const getStoredSessionToken = () => localStorage.getItem(SESSION_TOKEN_KEY)

export const getStoredSessionRole = (): AuthRole | null => {
  const stored = localStorage.getItem(SESSION_ROLE_KEY)
  return isAuthRole(stored) ? stored : null
}

export const clearSessionToken = () => {
  localStorage.removeItem(SESSION_TOKEN_KEY)
  localStorage.removeItem(SESSION_ROLE_KEY)
}

const mapAuthErrorMessage = (message: string) => {
  if (message.includes('Usuario nao encontrado')) {
    return 'Usuario nao encontrado.'
  }

  if (message.includes('Senha invalida')) {
    return 'Senha invalida.'
  }

  if (
    message.includes('Failed to fetch') ||
    message.includes('Load failed') ||
    message.includes('NetworkError')
  ) {
    return 'Falha ao conectar com o Supabase. Verifique a configuracao do projeto e tente novamente.'
  }

  return message
}

export const login = async (username: string, password: string): Promise<AuthSession> => {
  const { data, error } = await supabase.rpc('app_login', {
    p_username: username.trim(),
    p_password: password,
  })

  if (error) {
    throw new Error(mapAuthErrorMessage(error.message))
  }

  const session = parseSession(data)
  localStorage.setItem(SESSION_TOKEN_KEY, session.token)
  localStorage.setItem(SESSION_ROLE_KEY, session.role)
  return session
}

export const validateSession = async (token: string): Promise<AuthSession | null> => {
  const { data, error } = await supabase.rpc('app_validate_session', {
    p_token: token,
  })

  if (error) {
    throw new Error(mapAuthErrorMessage(error.message))
  }

  if (!data) {
    return null
  }

  const session = parseSession(data)
  localStorage.setItem(SESSION_ROLE_KEY, session.role)
  return session
}

export const logoutSession = async () => {
  const token = getStoredSessionToken()
  if (!token) {
    return
  }

  await supabase.rpc('app_logout', {
    p_token: token,
  })
}

export const updateMyAvatar = async (avatarUrl: string): Promise<string | null> => {
  const token = getStoredSessionToken()
  if (!token) {
    throw new Error('Sessao invalida. Faca login novamente.')
  }

  const { data, error } = await supabase.rpc('app_update_my_avatar', {
    p_token: token,
    p_avatar_url: avatarUrl.trim() || null,
  })

  if (error) {
    throw new Error(mapAuthErrorMessage(error.message))
  }

  const payload = data as { avatar_url?: string | null } | null
  return payload?.avatar_url ?? null
}
