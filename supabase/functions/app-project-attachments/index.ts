import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type AttachmentAction = 'list' | 'upload' | 'delete'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_SIZE_BYTES = 20 * 1024 * 1024
const BUCKET = 'app-project-attachments'

const sanitizeFileName = (name: string) => name.replace(/[^A-Za-z0-9._-]/g, '_')

const normalizeBaseUrl = (url: string, path: string) => {
  const base = url.replace(/\/+$/, '')
  return `${base}${path}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Variaveis de ambiente do Supabase ausentes.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const contentType = req.headers.get('content-type') || ''
    let action: AttachmentAction | null = null
    let appSessionToken: string | null = null
    let projectId: string | null = null
    let attachmentId: string | null = null
    let file: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      action = formData.get('action')?.toString() as AttachmentAction | null
      appSessionToken = formData.get('appSessionToken')?.toString() ?? null
      projectId = formData.get('projectId')?.toString() ?? null
      attachmentId = formData.get('attachmentId')?.toString() ?? null
      const fileEntry = formData.get('file')
      file = fileEntry instanceof File ? fileEntry : null
    } else {
      const body = (await req.json()) as {
        action?: AttachmentAction
        appSessionToken?: string
        projectId?: string
        attachmentId?: string
      }
      action = body.action ?? null
      appSessionToken = body.appSessionToken ?? null
      projectId = body.projectId ?? null
      attachmentId = body.attachmentId ?? null
    }

    if (!action || !appSessionToken || !projectId) {
      return new Response(JSON.stringify({ error: 'Campos obrigatorios ausentes.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: sessionUser, error: sessionError } = await supabase.rpc('app_session_user', {
      p_token: appSessionToken,
    })

    if (sessionError || !sessionUser || sessionUser.role !== 'user') {
      return new Response(JSON.stringify({ error: 'Sessao invalida para anexos.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: project, error: projectError } = await supabase
      .from('app_projects')
      .select('id, owner_app_user_id, status, deleted_at')
      .eq('id', projectId)
      .maybeSingle()

    if (
      projectError ||
      !project ||
      project.owner_app_user_id !== sessionUser.id ||
      project.deleted_at !== null
    ) {
      return new Response(JSON.stringify({ error: 'Projeto nao encontrado para este usuario.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'list') {
      const { data, error } = await supabase
        .from('app_project_attachments')
        .select('id, file_name, mime_type, size_bytes, storage_path, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const publicApiBase = normalizeBaseUrl(supabaseUrl, '/storage/v1/object/sign')

      const enriched = await Promise.all(
        (data ?? []).map(async (item) => {
          const { data: signed, error: signedError } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(item.storage_path, 60 * 60)

          return {
            ...item,
            download_url:
              !signedError && signed?.signedUrl
                ? signed.signedUrl.startsWith('http')
                  ? signed.signedUrl
                  : `${publicApiBase}${signed.signedUrl}`
                : null,
          }
        }),
      )

      return new Response(JSON.stringify({ attachments: enriched }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'upload') {
      if (!file) {
        return new Response(JSON.stringify({ error: 'Arquivo nao enviado.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (file.size <= 0 || file.size > MAX_SIZE_BYTES) {
        return new Response(JSON.stringify({ error: 'Arquivo invalido. Limite de 20 MB.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const safeName = sanitizeFileName(file.name || 'anexo')
      const path = `${sessionUser.id}/${projectId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      })

      if (uploadError) {
        return new Response(JSON.stringify({ error: uploadError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: inserted, error: insertError } = await supabase
        .from('app_project_attachments')
        .insert({
          project_id: projectId,
          owner_app_user_id: sessionUser.id,
          file_name: safeName,
          storage_path: path,
          mime_type: file.type || null,
          size_bytes: file.size,
        })
        .select('id, file_name, mime_type, size_bytes, storage_path, created_at')
        .single()

      if (insertError || !inserted) {
        await supabase.storage.from(BUCKET).remove([path])
        return new Response(JSON.stringify({ error: insertError?.message || 'Falha ao salvar anexo.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: signed, error: signedError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60)

      const publicApiBase = normalizeBaseUrl(supabaseUrl, '/storage/v1/object/sign')

      return new Response(
        JSON.stringify({
          attachment: {
            ...inserted,
            download_url:
              !signedError && signed?.signedUrl
                ? signed.signedUrl.startsWith('http')
                  ? signed.signedUrl
                  : `${publicApiBase}${signed.signedUrl}`
                : null,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (action === 'delete') {
      if (!attachmentId) {
        return new Response(JSON.stringify({ error: 'attachmentId obrigatorio.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: attachment, error: attachmentError } = await supabase
        .from('app_project_attachments')
        .select('id, storage_path, owner_app_user_id, project_id')
        .eq('id', attachmentId)
        .eq('project_id', projectId)
        .maybeSingle()

      if (attachmentError || !attachment || attachment.owner_app_user_id !== sessionUser.id) {
        return new Response(JSON.stringify({ error: 'Anexo nao encontrado para exclusao.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: removeStorageError } = await supabase.storage
        .from(BUCKET)
        .remove([attachment.storage_path])

      if (removeStorageError) {
        return new Response(JSON.stringify({ error: removeStorageError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { error: deleteRowError } = await supabase
        .from('app_project_attachments')
        .delete()
        .eq('id', attachment.id)

      if (deleteRowError) {
        return new Response(JSON.stringify({ error: deleteRowError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Acao invalida.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro inesperado.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
