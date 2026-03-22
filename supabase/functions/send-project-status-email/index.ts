import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type Decision = 'aprovado' | 'reprovado' | 'em_ajustes'

type RequestBody = {
  appSessionToken?: string
  projectId?: string
  appBaseUrl?: string
  recipientEmail?: string
  recipientName?: string | null
  projectTitle?: string
  decision?: Decision
  adminMessage?: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const statusLabel: Record<Decision, string> = {
  aprovado: 'Aprovado',
  reprovado: 'Recusado',
  em_ajustes: 'Em ajustes',
}

const decisionContent: Record<
  Decision,
  { headline: string; summary: string; nextStep: string }
> = {
  aprovado: {
    headline: 'Seu projeto foi aprovado',
    summary: 'Parabens! A avaliacao foi concluida com aprovacao.',
    nextStep: 'Acesse os detalhes para acompanhar os proximos passos.',
  },
  reprovado: {
    headline: 'Seu projeto foi recusado',
    summary: 'A avaliacao foi concluida com recusado.',
    nextStep: 'Acesse os detalhes para entender os motivos informados.',
  },
  em_ajustes: {
    headline: 'Seu projeto precisa de ajustes',
    summary: 'A avaliacao foi concluida com pedido de ajustes.',
    nextStep: 'Acesse os detalhes para revisar o que precisa ser ajustado.',
  },
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      appSessionToken,
      projectId,
      appBaseUrl,
      recipientEmail,
      recipientName,
      projectTitle,
      decision,
      adminMessage,
    } = (await req.json()) as RequestBody

    if (!appSessionToken || !projectId || !recipientEmail || !projectTitle || !decision) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatorios ausentes.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL')
    const resendFromName = Deno.env.get('RESEND_FROM_NAME')?.trim()

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !resendFromEmail) {
      return new Response(
        JSON.stringify({ error: 'Variaveis de ambiente obrigatorias nao configuradas.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: sessionUser, error: sessionError } = await supabase.rpc('app_session_user', {
      p_token: appSessionToken,
    })

    if (sessionError || !sessionUser || sessionUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Somente admin pode enviar notificacao de status.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const cleanMessage = adminMessage?.trim() || null
    const normalizedBaseUrl = (appBaseUrl?.trim() || 'http://localhost:5173').replace(/\/+$/, '')
    const projectUrl = `${normalizedBaseUrl}/usuario/meus-projetos/${projectId}`
    const safeRecipientName = escapeHtml(recipientName?.trim() || 'Professor(a)')
    const safeProjectTitle = escapeHtml(projectTitle.trim())
    const safeStatusLabel = escapeHtml(statusLabel[decision])
    const safeProjectUrl = escapeHtml(projectUrl)
    const safeHeadline = escapeHtml(decisionContent[decision].headline)
    const safeSummary = escapeHtml(decisionContent[decision].summary)
    const safeNextStep = escapeHtml(decisionContent[decision].nextStep)

    const messageSection = cleanMessage
      ? `
        <div style="margin: 20px 0; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #475569; font-weight: 700;">Mensagem da avaliacao</p>
          <p style="margin: 0; font-size: 14px; color: #0f172a;">${escapeHtml(cleanMessage)}</p>
        </div>
      `
      : ''

    const html = `
      <div style="margin: 0; padding: 24px; background: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a;">
        <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden;">
          <div style="padding: 20px 24px; background: #0f172a; color: #ffffff;">
            <p style="margin: 0; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; opacity: .85;">Plataforma de Projetos</p>
            <h1 style="margin: 8px 0 0; font-size: 20px; font-weight: 700;">Atualizacao de Status</h1>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 10px; font-size: 15px;">Ola, ${safeRecipientName}.</p>
            <p style="margin: 0 0 10px; font-size: 16px; font-weight: 700;">${safeHeadline}</p>
            <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6;">
              ${safeSummary}
            </p>
            <div style="display: inline-block; margin: 0 0 16px; padding: 8px 12px; border-radius: 999px; background: #ecfeff; color: #155e75; font-size: 13px; font-weight: 700; border: 1px solid #a5f3fc;">
              Status: ${safeStatusLabel}
            </div>
            <p style="margin: 0 0 10px; font-size: 14px; color: #334155;">
              Projeto: <strong>${safeProjectTitle}</strong>
            </p>
            <p style="margin: 0 0 12px; font-size: 14px; color: #475569;">${safeNextStep}</p>
            ${messageSection}
            <a href="${safeProjectUrl}" style="display: inline-block; margin-top: 8px; padding: 12px 18px; border-radius: 10px; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700;">
              Ver projeto
            </a>
            <p style="margin: 18px 0 0; font-size: 12px; color: #64748b;">
              Se o botao nao funcionar, copie e cole este link no navegador:<br />
              <span style="word-break: break-all;">${safeProjectUrl}</span>
            </p>
          </div>
        </div>
      </div>
    `

    const textLines = [
      `Ola, ${recipientName?.trim() || 'Professor(a)'}.`,
      decisionContent[decision].headline,
      decisionContent[decision].summary,
      `Projeto: "${projectTitle.trim()}".`,
      `Status: ${statusLabel[decision]}.`,
      decisionContent[decision].nextStep,
      cleanMessage ? `Mensagem da avaliacao: ${cleanMessage}` : null,
      `Abrir projeto: ${projectUrl}`,
    ].filter(Boolean)

    const fromAddress = resendFromName
      ? `${resendFromName} <${resendFromEmail}>`
      : resendFromEmail

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [recipientEmail],
        subject: `Atualizacao do projeto: ${projectTitle.trim()}`,
        html,
        text: textLines.join('\n\n'),
      }),
    })

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text()
      return new Response(
        JSON.stringify({ error: 'Falha ao enviar e-mail.', details: errorBody }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
