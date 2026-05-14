import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ACKNOWLEDGEMENT_OPTIONS } from './extensionPlan'
import {
  collectFormErrors,
  disciplineFormSchema,
  extensionFormSchema,
} from './projectSchemas'

const validDiscipline = {
  title: 'Projeto X',
  thematicArea: 'TIC',
  codigoDisciplina: 'CS101',
  semestreLetivo: '2025.1',
  course: 'Ciencia da Computacao',
  periodStart: '2025-01-01',
  periodEnd: '2025-06-30',
  targetAudience: 'Comunidade',
  budget: '500',
  description: 'Resumo da disciplina',
}

const validExtension = {
  title: 'Iniciativa',
  totalWorkload: '40',
  unicapProgram: 'UNICAP - TIC',
  periodStart: '2025-01-01',
  periodEnd: '2025-06-30',
  linkedCourse: 'Ciencia da Computacao',
  courseName: 'CC',
  coordinationEmail: 'coord@unicap.br',
  coordinatorName: 'Joao Silva',
  coordinatorEmail: 'joao@unicap.br',
  coordinatorCpf: '12345678900',
  coordinatorPhone: '81999999999',
  coordinatorWeeklyHours: '4',
  coordinatorParticipation: 'Voluntario',
  otherVolunteerTeachers: '',
  studentWeeklyHours: '4',
  studentParticipants: 'Aluno 1',
  learningObjectives: ['Obj 1', 'Obj 2', 'Obj 3'],
  transversalCompetencies: ['Comunicacao', 'Lideranca', 'Trabalho em equipe'],
  serviceOffered: 'Oficinas',
  activities: ['Ativ 1', 'Ativ 2', 'Ativ 3'],
  executionLocation: 'Campus',
  targetAudience: 'Comunidade',
  methodologicalProcedures: 'Procedimento metodologico',
  problemStatement: 'Necessidade X',
  sustainableDevelopmentGoal: 'ODS 4',
  goals: ['Meta 1', 'Meta 2', 'Meta 3'],
  disseminationStrategies: 'Redes sociais',
  projectSummary: 'Resumo do projeto',
  reflectionStrategies: 'Reflexao',
  evaluationStrategies: 'Avaliacao',
  partnerFeedback: 'Feedback',
  additionalInformation: '',
  acknowledgements: ACKNOWLEDGEMENT_OPTIONS.map((item) => item.id),
}

describe('disciplineFormSchema', () => {
  it('aceita objeto valido', () => {
    const result = disciplineFormSchema.safeParse(validDiscipline)
    expect(result.success).toBe(true)
  })

  it('rejeita titulo vazio com mensagem especifica', () => {
    const result = disciplineFormSchema.safeParse({ ...validDiscipline, title: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('Titulo'))).toBe(true)
    }
  })

  it('rejeita periodEnd menor que periodStart', () => {
    const result = disciplineFormSchema.safeParse({
      ...validDiscipline,
      periodStart: '2025-06-30',
      periodEnd: '2025-01-01',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message)
      expect(msgs.some((m) => m.includes('data inicial nao pode ser maior'))).toBe(true)
    }
  })

  it('rejeita orcamento nao numerico', () => {
    const result = disciplineFormSchema.safeParse({ ...validDiscipline, budget: 'abc' })
    expect(result.success).toBe(false)
  })

  it('rejeita orcamento vazio', () => {
    const result = disciplineFormSchema.safeParse({ ...validDiscipline, budget: '' })
    expect(result.success).toBe(false)
  })

  it('aceita course vazio (opcional)', () => {
    const result = disciplineFormSchema.safeParse({ ...validDiscipline, course: '' })
    expect(result.success).toBe(true)
  })

  it('aceita budget igual a zero', () => {
    const result = disciplineFormSchema.safeParse({ ...validDiscipline, budget: '0' })
    expect(result.success).toBe(true)
  })
})

describe('extensionFormSchema', () => {
  it('aceita objeto valido com todos acknowledgements', () => {
    const result = extensionFormSchema.safeParse(validExtension)
    expect(result.success).toBe(true)
  })

  it('rejeita email de coordenacao invalido', () => {
    const result = extensionFormSchema.safeParse({
      ...validExtension,
      coordinationEmail: 'nao-eh-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita learningObjectives com menos de 3 itens', () => {
    const result = extensionFormSchema.safeParse({
      ...validExtension,
      learningObjectives: ['so um', 'dois'],
    })
    expect(result.success).toBe(false)
  })

  it('rejeita learningObjectives com item vazio', () => {
    const result = extensionFormSchema.safeParse({
      ...validExtension,
      learningObjectives: ['Obj 1', '', 'Obj 3'],
    })
    expect(result.success).toBe(false)
  })

  it('rejeita quando faltam acknowledgements', () => {
    const result = extensionFormSchema.safeParse({
      ...validExtension,
      acknowledgements: [ACKNOWLEDGEMENT_OPTIONS[0].id],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('confirmacao'))).toBe(true)
    }
  })

  it('rejeita periodEnd menor que periodStart', () => {
    const result = extensionFormSchema.safeParse({
      ...validExtension,
      periodStart: '2025-12-01',
      periodEnd: '2025-01-01',
    })
    expect(result.success).toBe(false)
  })
})

describe('collectFormErrors', () => {
  it('extrai mensagens das issues do zod', () => {
    const schema = z.object({ name: z.string().min(1, 'nome obrigatorio') })
    const result = schema.safeParse({ name: '' })
    if (result.success) throw new Error('esperava falha')
    const msgs = collectFormErrors(result.error.issues)
    expect(msgs).toContain('nome obrigatorio')
  })

  it('deduplica mensagens identicas no mesmo path', () => {
    const issues = [
      { path: ['x'], message: 'erro' },
      { path: ['x'], message: 'erro' },
      { path: ['x'], message: 'outro' },
    ] as unknown as z.core.$ZodIssue[]
    const msgs = collectFormErrors(issues)
    expect(msgs).toEqual(['erro', 'outro'])
  })

  it('preserva ordem original', () => {
    const issues = [
      { path: ['a'], message: 'primeiro' },
      { path: ['b'], message: 'segundo' },
      { path: ['c'], message: 'terceiro' },
    ] as unknown as z.core.$ZodIssue[]
    expect(collectFormErrors(issues)).toEqual(['primeiro', 'segundo', 'terceiro'])
  })

  it('retorna array vazio quando nao ha issues', () => {
    expect(collectFormErrors([])).toEqual([])
  })
})
