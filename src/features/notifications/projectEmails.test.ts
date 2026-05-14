import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

import { supabase } from '../../lib/supabase'
import { sendProjectStatusEmail } from './projectEmails'

const TOKEN_KEY = 'extensao_session_token'
const invoke = vi.mocked(supabase.functions.invoke)

const baseInput = {
  projectId: 'p1',
  recipientEmail: 'prof@unicap.br',
  recipientName: 'Prof',
  projectTitle: 'Projeto X',
  decision: 'aprovado' as const,
  adminMessage: null,
}

beforeEach(() => {
  invoke.mockReset()
  localStorage.clear()
})

const setToken = () => localStorage.setItem(TOKEN_KEY, 'tok')

describe('sendProjectStatusEmail', () => {
  it('lanca quando nao ha token', async () => {
    await expect(sendProjectStatusEmail(baseInput)).rejects.toThrow(/Sessao invalida/)
  })

  it('chama functions.invoke com payload completo', async () => {
    setToken()
    invoke.mockResolvedValue({ data: { success: true }, error: null } as never)
    await sendProjectStatusEmail(baseInput)
    expect(invoke).toHaveBeenCalledWith(
      'send-project-status-email',
      expect.objectContaining({
        body: expect.objectContaining({
          appSessionToken: 'tok',
          projectId: 'p1',
          recipientEmail: 'prof@unicap.br',
          decision: 'aprovado',
        }),
      }),
    )
  })

  it('lanca erro do supabase functions invoke', async () => {
    setToken()
    invoke.mockResolvedValue({
      data: null,
      error: { message: 'falha edge' },
    } as never)
    await expect(sendProjectStatusEmail(baseInput)).rejects.toThrow('falha edge')
  })

  it('inclui details do context quando disponivel', async () => {
    setToken()
    const context = {
      json: vi.fn().mockResolvedValue({ details: 'rate limit' }),
    }
    invoke.mockResolvedValue({
      data: null,
      error: { message: 'falha', context },
    } as never)
    await expect(sendProjectStatusEmail(baseInput)).rejects.toThrow('falha: rate limit')
  })

  it('lanca erro do payload quando success !== true', async () => {
    setToken()
    invoke.mockResolvedValue({
      data: { success: false, error: 'email invalido' },
      error: null,
    } as never)
    await expect(sendProjectStatusEmail(baseInput)).rejects.toThrow('email invalido')
  })

  it('lanca fallback quando payload nao tem success nem error', async () => {
    setToken()
    invoke.mockResolvedValue({ data: {}, error: null } as never)
    await expect(sendProjectStatusEmail(baseInput)).rejects.toThrow('Falha ao enviar e-mail.')
  })
})
