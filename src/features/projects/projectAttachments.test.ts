import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

import { supabase } from '../../lib/supabase'
import {
  deleteProjectAttachment,
  listProjectAttachments,
  uploadProjectAttachment,
} from './projectAttachments'

const TOKEN_KEY = 'extensao_session_token'
const invoke = vi.mocked(supabase.functions.invoke)

beforeEach(() => {
  invoke.mockReset()
  localStorage.clear()
})

const setToken = () => localStorage.setItem(TOKEN_KEY, 'tok')

describe('listProjectAttachments', () => {
  it('lanca quando nao ha token', async () => {
    await expect(listProjectAttachments('p1')).rejects.toThrow(/Sessao invalida/)
  })

  it('chama functions.invoke com action=list', async () => {
    setToken()
    invoke.mockResolvedValue({ data: { attachments: [] }, error: null } as never)
    await listProjectAttachments('p1')
    expect(invoke).toHaveBeenCalledWith('app-project-attachments', {
      body: { action: 'list', appSessionToken: 'tok', projectId: 'p1' },
    })
  })

  it('retorna array de anexos', async () => {
    setToken()
    const att = [{ id: 'a1', file_name: 'x.pdf' }]
    invoke.mockResolvedValue({ data: { attachments: att }, error: null } as never)
    const result = await listProjectAttachments('p1')
    expect(result).toEqual(att)
  })

  it('retorna [] quando attachments ausente', async () => {
    setToken()
    invoke.mockResolvedValue({ data: {}, error: null } as never)
    expect(await listProjectAttachments('p1')).toEqual([])
  })

  it('propaga erro do supabase', async () => {
    setToken()
    invoke.mockResolvedValue({ data: null, error: { message: 'falha' } } as never)
    await expect(listProjectAttachments('p1')).rejects.toThrow('falha')
  })

  it('lanca erro retornado no payload da edge function', async () => {
    setToken()
    invoke.mockResolvedValue({ data: { error: 'sem permissao' }, error: null } as never)
    await expect(listProjectAttachments('p1')).rejects.toThrow('sem permissao')
  })
})

describe('uploadProjectAttachment', () => {
  it('chama functions.invoke com FormData contendo o arquivo', async () => {
    setToken()
    const file = new File(['hello'], 'foo.txt', { type: 'text/plain' })
    invoke.mockResolvedValue({
      data: { attachment: { id: 'a1', file_name: 'foo.txt' } },
      error: null,
    } as never)

    await uploadProjectAttachment('p1', file)

    expect(invoke).toHaveBeenCalled()
    const args = invoke.mock.calls[0]
    expect(args[0]).toBe('app-project-attachments')
    const body = args[1]?.body as FormData
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('action')).toBe('upload')
    expect(body.get('appSessionToken')).toBe('tok')
    expect(body.get('projectId')).toBe('p1')
    expect(body.get('file')).toBe(file)
  })

  it('retorna o attachment', async () => {
    setToken()
    const file = new File(['hi'], 'foo.txt')
    const att = { id: 'a1', file_name: 'foo.txt' }
    invoke.mockResolvedValue({ data: { attachment: att }, error: null } as never)
    const result = await uploadProjectAttachment('p1', file)
    expect(result).toEqual(att)
  })

  it('lanca quando edge function retorna error', async () => {
    setToken()
    const file = new File(['hi'], 'foo.txt')
    invoke.mockResolvedValue({ data: { error: 'arquivo grande' }, error: null } as never)
    await expect(uploadProjectAttachment('p1', file)).rejects.toThrow('arquivo grande')
  })

  it('lanca fallback quando nao ha attachment nem error', async () => {
    setToken()
    const file = new File(['hi'], 'foo.txt')
    invoke.mockResolvedValue({ data: {}, error: null } as never)
    await expect(uploadProjectAttachment('p1', file)).rejects.toThrow('Falha ao enviar anexo.')
  })
})

describe('deleteProjectAttachment', () => {
  it('chama functions.invoke com action=delete', async () => {
    setToken()
    invoke.mockResolvedValue({ data: { success: true }, error: null } as never)
    await deleteProjectAttachment('p1', 'a1')
    expect(invoke).toHaveBeenCalledWith('app-project-attachments', {
      body: {
        action: 'delete',
        appSessionToken: 'tok',
        projectId: 'p1',
        attachmentId: 'a1',
      },
    })
  })

  it('lanca quando success !== true', async () => {
    setToken()
    invoke.mockResolvedValue({ data: { success: false, error: 'nao pode' }, error: null } as never)
    await expect(deleteProjectAttachment('p1', 'a1')).rejects.toThrow('nao pode')
  })

  it('lanca fallback quando data nao tem success nem error', async () => {
    setToken()
    invoke.mockResolvedValue({ data: {}, error: null } as never)
    await expect(deleteProjectAttachment('p1', 'a1')).rejects.toThrow('Falha ao excluir anexo.')
  })
})
