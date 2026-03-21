import { getStoredSessionToken } from '../../auth/appAuth'
import { supabase } from '../../lib/supabase'

export type ProjectAttachment = {
  id: string
  file_name: string
  mime_type: string | null
  size_bytes: number
  storage_path: string
  created_at: string
  download_url: string | null
}

const getTokenOrThrow = () => {
  const token = getStoredSessionToken()
  if (!token) {
    throw new Error('Sessao invalida. Faca login novamente.')
  }
  return token
}

export const listProjectAttachments = async (projectId: string): Promise<ProjectAttachment[]> => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.functions.invoke('app-project-attachments', {
    body: {
      action: 'list',
      appSessionToken: token,
      projectId,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  const response = data as { attachments?: ProjectAttachment[]; error?: string } | null
  if (response?.error) {
    throw new Error(response.error)
  }

  return response?.attachments ?? []
}

export const uploadProjectAttachment = async (projectId: string, file: File): Promise<ProjectAttachment> => {
  const token = getTokenOrThrow()

  const formData = new FormData()
  formData.append('action', 'upload')
  formData.append('appSessionToken', token)
  formData.append('projectId', projectId)
  formData.append('file', file)

  const { data, error } = await supabase.functions.invoke('app-project-attachments', {
    body: formData,
  })

  if (error) {
    throw new Error(error.message)
  }

  const response = data as { attachment?: ProjectAttachment; error?: string } | null
  if (response?.error || !response?.attachment) {
    throw new Error(response?.error || 'Falha ao enviar anexo.')
  }

  return response.attachment
}

export const deleteProjectAttachment = async (projectId: string, attachmentId: string) => {
  const token = getTokenOrThrow()

  const { data, error } = await supabase.functions.invoke('app-project-attachments', {
    body: {
      action: 'delete',
      appSessionToken: token,
      projectId,
      attachmentId,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  const response = data as { success?: boolean; error?: string } | null
  if (response?.success !== true) {
    throw new Error(response?.error || 'Falha ao excluir anexo.')
  }
}
