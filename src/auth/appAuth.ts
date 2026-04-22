import type { AuthSession } from '../App'
import { supabase } from '../lib/supabase'

const SESSION_TOKEN_KEY = 'extensao_session_token'
const USERNAME_DIGITS_LENGTH = 11

type LoginResponse = {
  token: string
  user_id: string
  username: string
  display_name: string
  email?: string | null
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
    email: data.email ?? null,
    avatar_url: data.avatar_url ?? null,
  }
}

export const getStoredSessionToken = () => localStorage.getItem(SESSION_TOKEN_KEY)

export const clearSessionToken = () => {
  localStorage.removeItem(SESSION_TOKEN_KEY)
}

const normalizeUserUsername = (username: string) => username.replace(/\D/g, '')

const mapAuthErrorMessage = (message: string) => {
  if (message.includes('Usuario nao encontrado')) {
    return 'RA nao encontrado. Informe um RA cadastrado com 11 digitos.'
  }

  if (message.includes('Admin nao encontrado')) {
    return 'Admin nao encontrado.'
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

export const loginUser = async (username: string): Promise<AuthSession> => {
  const normalizedUsername = normalizeUserUsername(username)

  if (normalizedUsername.length !== USERNAME_DIGITS_LENGTH) {
    throw new Error('Informe um RA valido com 11 digitos.')
  }

  const { data, error } = await supabase.rpc('app_login_user', {
    p_username: normalizedUsername,
  })

  if (error) {
    throw new Error(mapAuthErrorMessage(error.message))
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
    throw new Error(mapAuthErrorMessage(error.message))
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
    throw new Error(mapAuthErrorMessage(error.message))
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
    throw new Error(mapAuthErrorMessage(error.message))
  }

  const payload = data as { avatar_url?: string | null } | null
  return payload?.avatar_url ?? null
}

type UpdateMyProfileInput = {
  displayName: string
  email: string
  avatarUrl: string
}

type UpdateMyProfileResponse = {
  display_name: string
  email: string | null
  avatar_url: string | null
}

export const updateMyProfile = async (
  payload: UpdateMyProfileInput,
): Promise<UpdateMyProfileResponse> => {
  const token = getStoredSessionToken()
  if (!token) {
    throw new Error('Sessao invalida. Faca login novamente.')
  }

  const { data, error } = await supabase.rpc('app_update_my_profile', {
    p_token: token,
    p_display_name: payload.displayName.trim(),
    p_email: payload.email.trim(),
    p_avatar_url: payload.avatarUrl.trim() || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  const response = data as UpdateMyProfileResponse | null
  if (!response) {
    throw new Error('Resposta invalida do servidor ao atualizar perfil.')
  }

  return {
    display_name: response.display_name,
    email: response.email ?? null,
    avatar_url: response.avatar_url ?? null,
  }
}
