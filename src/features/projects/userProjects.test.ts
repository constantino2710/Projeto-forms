import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../lib/supabase', () => ({
  supabase: { rpc: vi.fn() },
}))

import { supabase } from '../../lib/supabase'
import {
  createUserProject,
  deleteMyProject,
  duplicateMyProject,
  getMyProjectDetail,
  listMyProjects,
  projectStatusLabel,
  updateMyProjectDetails,
  updateMyProjectStatus,
} from './userProjects'

const TOKEN_KEY = 'extensao_session_token'
const ROLE_KEY = 'extensao_session_role'
const VALID_TOKEN = '11111111-2222-4333-8444-555555555555'

const rpc = vi.mocked(supabase.rpc)

beforeEach(() => {
  rpc.mockReset()
  localStorage.clear()
})

const setToken = (token = VALID_TOKEN) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, 'user')
}

describe('createUserProject', () => {
  const baseInput = {
    title: 'Projeto X',
    thematicArea: 'TIC',
    course: 'CC',
    periodStart: '2025-01-01',
    periodEnd: '2025-06-30',
    targetAudience: 'Comunidade',
    budget: 500,
    description: 'Desc',
    type: 'extensao' as const,
  }

  it('lanca quando nao ha token', async () => {
    await expect(createUserProject(baseInput)).rejects.toThrow(/Sessao invalida/)
  })

  it('limpa token e lanca quando token tem formato invalido', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-invalido')
    await expect(createUserProject(baseInput)).rejects.toThrow(/Sessao invalida/)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('chama RPC app_create_project_v2 com payload mapeado', async () => {
    setToken()
    rpc.mockResolvedValue({
      data: { id: '1', title: 'Projeto X', status: 'rascunho', created_at: '2025-01-01' },
      error: null,
    } as never)

    await createUserProject(baseInput)

    expect(rpc).toHaveBeenCalledWith(
      'app_create_project_v2',
      expect.objectContaining({
        p_token: VALID_TOKEN,
        p_title: 'Projeto X',
        p_type: 'extensao',
        p_thematic_area: 'TIC',
        p_course: 'CC',
        p_budget: 500,
      }),
    )
  })

  it('retorna o resultado da RPC', async () => {
    setToken()
    const result = { id: 'p1', title: 'X', status: 'rascunho' as const, created_at: 't' }
    rpc.mockResolvedValue({ data: result, error: null } as never)
    expect(await createUserProject(baseInput)).toEqual(result)
  })

  it('em erro de sessao, limpa o token armazenado', async () => {
    setToken()
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Sessao invalida ou token expirado' },
    } as never)
    await expect(createUserProject(baseInput)).rejects.toThrow()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('formata mensagem com details e hint', async () => {
    setToken()
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'Erro', details: 'campo X', hint: 'tente Y' },
    } as never)
    await expect(createUserProject(baseInput)).rejects.toThrow('Erro (campo X | tente Y)')
  })

  it('campos opcionais ausentes viram null no payload', async () => {
    setToken()
    rpc.mockResolvedValue({
      data: { id: '1', title: 'X', status: 'rascunho', created_at: 't' },
      error: null,
    } as never)
    await createUserProject({ ...baseInput, course: undefined, codigo_disciplina: undefined })
    expect(rpc).toHaveBeenCalledWith(
      'app_create_project_v2',
      expect.objectContaining({
        p_course: null,
        p_codigo_disciplina: null,
        p_extension_form: null,
      }),
    )
  })
})

describe('listMyProjects', () => {
  it('chama RPC com token armazenado', async () => {
    setToken()
    rpc.mockResolvedValue({ data: [], error: null } as never)
    await listMyProjects()
    expect(rpc).toHaveBeenCalledWith(
      'app_list_my_projects_v2',
      expect.objectContaining({ p_token: VALID_TOKEN }),
    )
  })

  it('retorna { rows: [], total: 0 } quando data e null', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: null } as never)
    expect(await listMyProjects()).toEqual({ rows: [], total: 0 })
  })

  it('propaga erro do RPC', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: { message: 'falha' } } as never)
    await expect(listMyProjects()).rejects.toThrow('falha')
  })
})

describe('getMyProjectDetail', () => {
  it('chama RPC com projectId', async () => {
    setToken()
    rpc.mockResolvedValue({ data: { id: 'p1' }, error: null } as never)
    await getMyProjectDetail('p1')
    expect(rpc).toHaveBeenCalledWith('app_get_my_project_detail_v2', {
      p_token: VALID_TOKEN,
      p_project_id: 'p1',
    })
  })

  it('lanca "Projeto nao encontrado" quando data e null', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: null } as never)
    await expect(getMyProjectDetail('p1')).rejects.toThrow('Projeto nao encontrado.')
  })
})

describe('updateMyProjectStatus', () => {
  it('chama RPC com status submetido', async () => {
    setToken()
    rpc.mockResolvedValue({ data: { ok: true }, error: null } as never)
    await updateMyProjectStatus('p1', 'submetido')
    expect(rpc).toHaveBeenCalledWith('app_update_project_status', {
      p_token: VALID_TOKEN,
      p_project_id: 'p1',
      p_status: 'submetido',
    })
  })

  it('propaga erro', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: { message: 'x' } } as never)
    await expect(updateMyProjectStatus('p1', 'rascunho')).rejects.toThrow('x')
  })
})

describe('duplicateMyProject', () => {
  it('cria um novo projeto usando os dados do projeto existente', async () => {
    setToken()
    const project = {
      id: 'p1',
      title: 'Projeto Duplicado',
      tipo: 'disciplina' as const,
      codigo_disciplina: 'CS1',
      semestre_letivo: '2025.1',
      thematic_area: 'TIC',
      course: 'CC',
      school: 'TIC',
      period_start: '2025-01-01',
      period_end: '2025-06-30',
      target_audience: 'Comunidade',
      budget: 500,
      description: 'Descricao',
      status: 'rascunho' as const,
      admin_message: null,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    }

    rpc.mockResolvedValue({
      data: { id: 'p2', title: 'Projeto Duplicado', status: 'rascunho', created_at: '2025-01-02' },
      error: null,
    } as never)

    const result = await duplicateMyProject(project)

    expect(result).toEqual({ id: 'p2', title: 'Projeto Duplicado', status: 'rascunho', created_at: '2025-01-02' })
    expect(rpc).toHaveBeenCalledWith(
      'app_create_project_v2',
      expect.objectContaining({
        p_token: VALID_TOKEN,
        p_title: 'Projeto Duplicado',
        p_type: 'disciplina',
        p_codigo_disciplina: 'CS1',
        p_semestre_letivo: '2025.1',
      }),
    )
  })
})

describe('updateMyProjectDetails', () => {
  it('mapeia campos camelCase para snake_case do RPC', async () => {
    setToken()
    rpc.mockResolvedValue({ data: { ok: true }, error: null } as never)
    await updateMyProjectDetails({
      projectId: 'p1',
      title: 'T',
      thematicArea: 'A',
      periodStart: '2025-01-01',
      periodEnd: '2025-06-30',
      targetAudience: 'X',
      budget: 100,
      description: 'D',
      codigoDisciplina: 'CS1',
      semestreLetivo: '2025.1',
    })
    expect(rpc).toHaveBeenCalledWith(
      'app_update_project_v2',
      expect.objectContaining({
        p_project_id: 'p1',
        p_codigo_disciplina: 'CS1',
        p_semestre_letivo: '2025.1',
        p_type: 'extensao',
      }),
    )
  })
})

describe('deleteMyProject', () => {
  it('chama RPC com projectId', async () => {
    setToken()
    rpc.mockResolvedValue({ data: null, error: null } as never)
    await deleteMyProject('p1')
    expect(rpc).toHaveBeenCalledWith('app_delete_project', {
      p_token: VALID_TOKEN,
      p_project_id: 'p1',
    })
  })

  it('em erro de sessao limpa o token', async () => {
    setToken()
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'token expirado' },
    } as never)
    await expect(deleteMyProject('p1')).rejects.toThrow()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe('projectStatusLabel', () => {
  it('cobre todos os status', () => {
    expect(projectStatusLabel.rascunho).toBe('Rascunho')
    expect(projectStatusLabel.submetido).toBe('Submetido')
    expect(projectStatusLabel.em_avaliacao).toBe('Em analise')
    expect(projectStatusLabel.em_ajustes).toBe('Em ajustes')
    expect(projectStatusLabel.aprovado).toBe('Aprovado')
    expect(projectStatusLabel.reprovado).toBe('Recusado')
  })
})
