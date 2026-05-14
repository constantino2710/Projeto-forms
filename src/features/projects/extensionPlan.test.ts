import { describe, expect, it } from 'vitest'
import {
  ACKNOWLEDGEMENT_OPTIONS,
  createEmptyExtensionPlan,
  createExtensionPlanFromProject,
  isExtensionPlanComplete,
  normalizeExtensionPlan,
} from './extensionPlan'

describe('createEmptyExtensionPlan', () => {
  it('zera todos os campos string', () => {
    const plan = createEmptyExtensionPlan()
    expect(plan.title).toBe('')
    expect(plan.coordinatorEmail).toBe('')
    expect(plan.targetAudience).toBe('')
  })

  it('inicializa arrays obrigatorios com 3 strings vazias', () => {
    const plan = createEmptyExtensionPlan()
    expect(plan.learningObjectives).toEqual(['', '', ''])
    expect(plan.transversalCompetencies).toEqual(['', '', ''])
    expect(plan.activities).toEqual(['', '', ''])
    expect(plan.goals).toEqual(['', '', ''])
  })

  it('inicializa acknowledgements como array vazio', () => {
    const plan = createEmptyExtensionPlan()
    expect(plan.acknowledgements).toEqual([])
  })
})

describe('normalizeExtensionPlan', () => {
  it('retorna plano vazio quando recebe null', () => {
    const plan = normalizeExtensionPlan(null)
    expect(plan.title).toBe('')
    expect(plan.learningObjectives).toEqual(['', '', ''])
  })

  it('retorna plano vazio quando recebe undefined', () => {
    const plan = normalizeExtensionPlan(undefined)
    expect(plan.title).toBe('')
  })

  it('retorna plano vazio quando recebe objeto vazio', () => {
    const plan = normalizeExtensionPlan({})
    expect(plan.title).toBe('')
    expect(plan.activities).toEqual(['', '', ''])
  })

  it('ignora campos com tipo errado (number em string vira "")', () => {
    const plan = normalizeExtensionPlan({ title: 123 as unknown as string })
    expect(plan.title).toBe('')
  })

  it('preserva strings validas', () => {
    const plan = normalizeExtensionPlan({
      title: 'Projeto X',
      coordinatorEmail: 'a@b.com',
    })
    expect(plan.title).toBe('Projeto X')
    expect(plan.coordinatorEmail).toBe('a@b.com')
  })

  it('preenche arrays curtos ate length 3', () => {
    const plan = normalizeExtensionPlan({
      learningObjectives: ['so um'],
    })
    expect(plan.learningObjectives).toEqual(['so um', '', ''])
  })

  it('substitui itens nao-string do array por ""', () => {
    const plan = normalizeExtensionPlan({
      activities: ['ok', 42 as unknown as string, null as unknown as string],
    })
    expect(plan.activities).toEqual(['ok', '', ''])
  })

  it('preserva acknowledgements como array sem length forcado', () => {
    const plan = normalizeExtensionPlan({
      acknowledgements: ['approval_required'],
    })
    expect(plan.acknowledgements).toEqual(['approval_required'])
  })
})

describe('createExtensionPlanFromProject', () => {
  it('usa campos do projeto quando o extension_form esta vazio', () => {
    const plan = createExtensionPlanFromProject({
      title: 'Projeto base',
      thematic_area: 'UNICAP - TIC',
      course: 'Ciencia da Computacao',
      period_start: '2025-01-01',
      period_end: '2025-06-30',
      target_audience: 'Comunidade',
      description: 'Resumo do projeto',
    })

    expect(plan.title).toBe('Projeto base')
    expect(plan.unicapProgram).toBe('UNICAP - TIC')
    expect(plan.courseName).toBe('Ciencia da Computacao')
    expect(plan.periodStart).toBe('2025-01-01')
    expect(plan.periodEnd).toBe('2025-06-30')
    expect(plan.targetAudience).toBe('Comunidade')
    expect(plan.projectSummary).toBe('Resumo do projeto')
  })

  it('preserva valores do extension_form quando preenchidos (override)', () => {
    const plan = createExtensionPlanFromProject({
      title: 'Do projeto',
      extension_form: {
        title: 'Do form',
        targetAudience: 'Especifico do form',
      },
    })

    expect(plan.title).toBe('Do form')
    expect(plan.targetAudience).toBe('Especifico do form')
  })

  it('lida com course null sem quebrar', () => {
    const plan = createExtensionPlanFromProject({ course: null })
    expect(plan.courseName).toBe('')
  })

  it('lida com extension_form ausente', () => {
    const plan = createExtensionPlanFromProject({ title: 'X' })
    expect(plan.title).toBe('X')
    expect(plan.acknowledgements).toEqual([])
  })
})

describe('isExtensionPlanComplete', () => {
  it('retorna false quando nao tem acknowledgements', () => {
    expect(isExtensionPlanComplete(createEmptyExtensionPlan())).toBe(false)
  })

  it('retorna false quando faltam alguns acknowledgements', () => {
    const plan = createEmptyExtensionPlan()
    plan.acknowledgements = [ACKNOWLEDGEMENT_OPTIONS[0].id, ACKNOWLEDGEMENT_OPTIONS[1].id]
    expect(isExtensionPlanComplete(plan)).toBe(false)
  })

  it('retorna true quando todos os acknowledgements estao marcados', () => {
    const plan = createEmptyExtensionPlan()
    plan.acknowledgements = ACKNOWLEDGEMENT_OPTIONS.map((item) => item.id)
    expect(isExtensionPlanComplete(plan)).toBe(true)
  })
})
