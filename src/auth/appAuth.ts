import type { AuthSession } from '../App'
import { supabase } from '../lib/supabase'

const SESSION_TOKEN_KEY = 'extensao_session_token'

type LoginResponse = {
  token: string
  user_id: string
  username: string
  display_name: string
  avatar_url?: string | null
  role: 'admin' | 'user'
}

const parseSession = (value: unknown): AuthSession => {
  const data = value as LoginResponse | null

  if (
    !data ||
    !data.token ||
    !data.user_id ||
    !data.username ||
    !data.display_name ||
    (data.role !== 'admin' && data.role !== 'user')
  ) {
    throw new Error('Sessao invalida recebida do servidor.')
  }

  return {
    ...data,
    avatar_url: data.avatar_url ?? null,
  }
}

export const getStoredSessionToken = () => localStorage.getItem(SESSION_TOKEN_KEY)

export const clearSessionToken = () => {
  localStorage.removeItem(SESSION_TOKEN_KEY)
}

export const loginUser = async (username: string): Promise<AuthSession> => {
  const { data, error } = await supabase.rpc('app_login_user', {
    p_username: username.trim(),
  })

  if (error) {
    throw new Error(error.message)
  }

  const session = parseSession(data)
  localStorage.setItem(SESSION_TOKEN_KEY, session.token)
  return session
}

export const loginAdmin = async (username: string, password: string): Promise<AuthSession> => {
  const { data, error } = await supabase.rpc('app_login_admin', {
    p_username: username.trim(),
    p_password: password,
  })

  if (error) {
    throw new Error(error.message)
  }

  const session = parseSession(data)
  localStorage.setItem(SESSION_TOKEN_KEY, session.token)
  return session
}

export const validateSession = async (token: string): Promise<AuthSession | null> => {
  const { data, error } = await supabase.rpc('app_validate_session', {
    p_token: token,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return parseSession(data)
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
    throw new Error(error.message)
  }

  const payload = data as { avatar_url?: string | null } | null
  return payload?.avatar_url ?? null
}
