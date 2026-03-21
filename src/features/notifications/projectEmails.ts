import { getStoredSessionToken } from '../../auth/appAuth'
import { supabase } from '../../lib/supabase'
import type { AdminProjectStatus } from '../projects/adminProjects'

type SendProjectStatusEmailInput = {
  projectId: string
  recipientEmail: string
  recipientName: string | null
  projectTitle: string
  decision: Extract<AdminProjectStatus, 'aprovado' | 'reprovado' | 'em_ajustes'>
  adminMessage: string | null
}

export const sendProjectStatusEmail = async (input: SendProjectStatusEmailInput) => {
  const token = getStoredSessionToken()

  if (!token) {
    throw new Error('Sessao invalida. Faca login novamente.')
  }

  const { data, error } = await supabase.functions.invoke('send-project-status-email', {
    body: {
      appSessionToken: token,
      projectId: input.projectId,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName,
      projectTitle: input.projectTitle,
      decision: input.decision,
      adminMessage: input.adminMessage,
      appBaseUrl: import.meta.env.VITE_APP_BASE_URL || window.location.origin,
    },
  })

  if (error) {
    let details = ''

    if ('context' in error && error.context) {
      try {
        const body = await error.context.json()
        details = body?.details || body?.error || ''
      } catch {
        details = ''
      }
    }

    throw new Error(details ? `${error.message}: ${details}` : error.message)
  }

  const response = data as { success?: boolean; error?: string } | null
  if (response?.success !== true) {
    throw new Error(response?.error || 'Falha ao enviar e-mail.')
  }
}
