import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { UserNewProjectPage } from './UserNewProjectPage'
import { createUserProject } from '../../features/projects/userProjects'
import { uploadProjectAttachment } from '../../features/projects/projectAttachments'

vi.mock('../../features/projects/userProjects', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../features/projects/userProjects')>()
  return {
    ...actual,
    createUserProject: vi.fn(),
  }
})
vi.mock('../../features/projects/projectAttachments', () => ({
  uploadProjectAttachment: vi.fn(),
}))
vi.mock('../../features/disciplines/disciplines', () => ({
  listDisciplines: vi.fn().mockResolvedValue([]),
}))

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/usuario/novo-projeto']}>
      <Routes>
        <Route path="/usuario/novo-projeto" element={<UserNewProjectPage />} />
        <Route path="/usuario/meus-projetos" element={<p>Lista de projetos</p>} />
      </Routes>
    </MemoryRouter>,
  )

describe('UserNewProjectPage', () => {
  beforeEach(() => {
    vi.mocked(createUserProject).mockReset()
    vi.mocked(uploadProjectAttachment).mockReset()
  })

  it('renderiza titulo e botoes de tipo', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: 'Novo Projeto' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Projeto de Extensao' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disciplina Extensionista' })).toBeInTheDocument()
  })

  it('renderiza form de extensao por padrao', () => {
    renderPage()
    expect(screen.getByLabelText('Titulo da Iniciativa')).toBeInTheDocument()
  })

  it('alternar para disciplina renderiza form simples', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Disciplina Extensionista' }))
    expect(screen.getByLabelText('Codigo Extensao')).toBeInTheDocument()
    expect(screen.getByLabelText('Carga horaria de Extensao da Disciplina')).toBeInTheDocument()
  })

  it('submeter disciplina vazia mostra lista de erros de validacao', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Disciplina Extensionista' }))
    // submit direto contorna a validacao HTML5 nativa para chegarmos na validacao Zod
    const form = screen.getByRole('button', { name: /Criar projeto/ }).closest('form')!
    fireEvent.submit(form)
    expect(await screen.findByText(/Corrija os campos abaixo/)).toBeInTheDocument()
    expect(createUserProject).not.toHaveBeenCalled()
  })

  it('submete disciplina valida e chama createUserProject', async () => {
    vi.mocked(createUserProject).mockResolvedValue({
      id: 'p1',
      title: 'Disc',
      status: 'rascunho',
      created_at: '2025-01-01',
    })
    const user = userEvent.setup({ delay: null })
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Disciplina Extensionista' }))
    await user.type(screen.getByLabelText('Titulo da Iniciativa'), 'Projeto Integrador em Dados')
    await user.selectOptions(screen.getByLabelText('Programa Unicap'), 'UNICAP - TIC - Tecnologia, Inovacao e Comunicacao')
    await user.type(screen.getByLabelText('Nome da Disciplina'), 'Disc')
    await user.type(screen.getByLabelText('Codigo Extensao'), '2025.2001')
    await user.type(screen.getByLabelText('Codigo da Disciplina'), 'CS1')
    await user.type(screen.getByLabelText('Codigo da Turma'), 'T01')
    await user.selectOptions(screen.getByLabelText('Disciplina Gerencial'), 'Nao')
    await user.type(screen.getByLabelText('Periodo de realizacao da disciplina'), '2025.1')
    await user.type(screen.getByLabelText('Curso em que a disciplina esta vinculada'), 'CC')
    fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: '2025-01-01' } })
    fireEvent.change(screen.getByLabelText('Fim'), { target: { value: '2025-06-30' } })
    await user.type(screen.getByLabelText('Carga horaria de Extensao da Disciplina'), '60')
    await user.type(screen.getByLabelText('Objetivo de Aprendizagem 1'), 'Obj 1')
    await user.type(screen.getByLabelText('Objetivo de Aprendizagem 2'), 'Obj 2')
    await user.type(screen.getByLabelText('Objetivo de Aprendizagem 3'), 'Obj 3')
    await user.selectOptions(screen.getByLabelText('Competencia Transversal 1'), 'Comunicacao')
    await user.selectOptions(screen.getByLabelText('Competencia Transversal 2'), 'Lideranca')
    await user.selectOptions(screen.getByLabelText('Competencia Transversal 3'), 'Trabalho em equipe')
    await user.type(screen.getByLabelText('Servico a ser oferecido'), 'Servico')
    await user.type(screen.getByLabelText('Atividade 1'), 'Ativ 1')
    await user.type(screen.getByLabelText('Atividade 2'), 'Ativ 2')
    await user.type(screen.getByLabelText('Atividade 3'), 'Ativ 3')
    await user.type(screen.getByLabelText('Local de realizacao'), 'Campus')
    await user.type(screen.getByLabelText('Publico que sera atendido'), 'Comunidade')
    await user.type(screen.getByLabelText('Procedimentos Metodologicos'), 'Procedimentos')
    await user.type(screen.getByLabelText('Problema ou Necessidade a ser respondido'), 'Problema')
    await user.selectOptions(
      screen.getByLabelText('Principal Objetivo de Desenvolvimento Sustentavel Impactado'),
      'ODS 4 - Educacao de Qualidade',
    )
    await user.type(screen.getByLabelText('Meta 1'), 'Meta 1')
    await user.type(screen.getByLabelText('Meta 2'), 'Meta 2')
    await user.type(screen.getByLabelText('Meta 3'), 'Meta 3')
    await user.type(screen.getByLabelText('Estrategias de Divulgacao da Atividade'), 'Divulgacao')
    await user.type(
      screen.getByLabelText('Texto breve com uma apresentacao/resumo do projeto'),
      'Resumo',
    )
    await user.type(screen.getByLabelText('Estrategias de Reflexao'), 'Reflexao')
    await user.type(screen.getByLabelText('Estrategias de Avaliacao'), 'Avaliacao')
    await user.type(screen.getByLabelText('Feedback do Publico Parceiro'), 'Feedback')
    const disciplineTerms = screen.getAllByRole('checkbox')
    for (const checkbox of disciplineTerms) {
      await user.click(checkbox)
    }
    await user.click(screen.getByRole('button', { name: /Criar projeto/ }))

    await waitFor(() => {
      expect(createUserProject).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Projeto Integrador em Dados',
          type: 'disciplina',
          budget: 60,
          targetAudience: 'Disc',
        }),
      )
    })
  }, 20000)

  it('mostra erro quando createUserProject lanca', async () => {
    vi.mocked(createUserProject).mockRejectedValue(new Error('Token expirado'))
    const user = userEvent.setup({ delay: null })
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Disciplina Extensionista' }))
    await user.type(screen.getByLabelText('Titulo da Iniciativa'), 'T')
    await user.selectOptions(screen.getByLabelText('Programa Unicap'), 'UNICAP - TIC - Tecnologia, Inovacao e Comunicacao')
    await user.type(screen.getByLabelText('Nome da Disciplina'), 'Disc')
    await user.type(screen.getByLabelText('Codigo Extensao'), '2025.2001')
    await user.type(screen.getByLabelText('Codigo da Disciplina'), 'CS1')
    await user.type(screen.getByLabelText('Codigo da Turma'), 'T01')
    await user.selectOptions(screen.getByLabelText('Disciplina Gerencial'), 'Nao')
    await user.type(screen.getByLabelText('Periodo de realizacao da disciplina'), '2025.1')
    await user.type(screen.getByLabelText('Curso em que a disciplina esta vinculada'), 'CC')
    fireEvent.change(screen.getByLabelText('Inicio'), { target: { value: '2025-01-01' } })
    fireEvent.change(screen.getByLabelText('Fim'), { target: { value: '2025-06-30' } })
    await user.type(screen.getByLabelText('Carga horaria de Extensao da Disciplina'), '60')
    await user.type(screen.getByLabelText('Objetivo de Aprendizagem 1'), 'Obj 1')
    await user.type(screen.getByLabelText('Objetivo de Aprendizagem 2'), 'Obj 2')
    await user.type(screen.getByLabelText('Objetivo de Aprendizagem 3'), 'Obj 3')
    await user.selectOptions(screen.getByLabelText('Competencia Transversal 1'), 'Comunicacao')
    await user.selectOptions(screen.getByLabelText('Competencia Transversal 2'), 'Lideranca')
    await user.selectOptions(screen.getByLabelText('Competencia Transversal 3'), 'Trabalho em equipe')
    await user.type(screen.getByLabelText('Servico a ser oferecido'), 'Servico')
    await user.type(screen.getByLabelText('Atividade 1'), 'Ativ 1')
    await user.type(screen.getByLabelText('Atividade 2'), 'Ativ 2')
    await user.type(screen.getByLabelText('Atividade 3'), 'Ativ 3')
    await user.type(screen.getByLabelText('Local de realizacao'), 'Campus')
    await user.type(screen.getByLabelText('Publico que sera atendido'), 'Comunidade')
    await user.type(screen.getByLabelText('Procedimentos Metodologicos'), 'Procedimentos')
    await user.type(screen.getByLabelText('Problema ou Necessidade a ser respondido'), 'Problema')
    await user.selectOptions(
      screen.getByLabelText('Principal Objetivo de Desenvolvimento Sustentavel Impactado'),
      'ODS 4 - Educacao de Qualidade',
    )
    await user.type(screen.getByLabelText('Meta 1'), 'Meta 1')
    await user.type(screen.getByLabelText('Meta 2'), 'Meta 2')
    await user.type(screen.getByLabelText('Meta 3'), 'Meta 3')
    await user.type(screen.getByLabelText('Estrategias de Divulgacao da Atividade'), 'Divulgacao')
    await user.type(
      screen.getByLabelText('Texto breve com uma apresentacao/resumo do projeto'),
      'Resumo',
    )
    await user.type(screen.getByLabelText('Estrategias de Reflexao'), 'Reflexao')
    await user.type(screen.getByLabelText('Estrategias de Avaliacao'), 'Avaliacao')
    await user.type(screen.getByLabelText('Feedback do Publico Parceiro'), 'Feedback')
    const disciplineTerms = screen.getAllByRole('checkbox')
    for (const checkbox of disciplineTerms) {
      await user.click(checkbox)
    }
    await user.click(screen.getByRole('button', { name: /Criar projeto/ }))

    expect(await screen.findByText('Token expirado')).toBeInTheDocument()
  }, 20000)
})
