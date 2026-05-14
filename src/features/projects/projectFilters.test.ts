import { describe, expect, it } from 'vitest'
import {
  applyProjectFilters,
  emptyProjectFilters,
  findSortOption,
  isProjectFilterActive,
  sortOptions,
  type ProjectFilterState,
} from './projectFilters'

type FakeProject = {
  id: string
  course?: string | null
  school?: string | null
  budget?: number | string | null
  period_start?: string | null
}

const baseProjects: FakeProject[] = [
  { id: 'a', course: 'CC', school: 'TIC', budget: 100, period_start: '2025-01-01' },
  { id: 'b', course: 'Med', school: 'Saude', budget: 50, period_start: '2025-03-01' },
  { id: 'c', course: 'CC', school: 'TIC', budget: 200, period_start: '2024-12-15' },
]

describe('isProjectFilterActive', () => {
  it('retorna false para estado vazio', () => {
    expect(isProjectFilterActive(emptyProjectFilters)).toBe(false)
  })

  it('retorna true quando tem curso', () => {
    expect(isProjectFilterActive({ ...emptyProjectFilters, course: 'CC' })).toBe(true)
  })

  it('retorna true quando tem escola', () => {
    expect(isProjectFilterActive({ ...emptyProjectFilters, school: 'TIC' })).toBe(true)
  })

  it('retorna true quando tem ordenacao', () => {
    expect(
      isProjectFilterActive({ ...emptyProjectFilters, sortKey: 'budget', sortDir: 'asc' }),
    ).toBe(true)
  })
})

describe('findSortOption', () => {
  it('localiza opcao time-asc', () => {
    const option = findSortOption('time', 'asc')
    expect(option.value).toBe('time-asc')
  })

  it('localiza opcao budget-desc', () => {
    const option = findSortOption('budget', 'desc')
    expect(option.value).toBe('budget-desc')
  })

  it('cai para default quando nao encontra (null, null)', () => {
    const option = findSortOption(null, null)
    expect(option.value).toBe('default')
  })

  it('cai para default quando combinacao nao existe', () => {
    const option = findSortOption('budget', null)
    expect(option.value).toBe('default')
  })

  it('todas as opcoes do sortOptions sao localizaveis', () => {
    for (const expected of sortOptions) {
      const found = findSortOption(expected.sortKey, expected.sortDir)
      expect(found.value).toBe(expected.value)
    }
  })
})

describe('applyProjectFilters', () => {
  it('retorna a lista intacta quando nao ha filtros', () => {
    const result = applyProjectFilters(baseProjects, emptyProjectFilters)
    expect(result).toEqual(baseProjects)
  })

  it('filtra por curso', () => {
    const result = applyProjectFilters(baseProjects, { ...emptyProjectFilters, course: 'CC' })
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.id)).toEqual(['a', 'c'])
  })

  it('filtra por escola', () => {
    const result = applyProjectFilters(baseProjects, { ...emptyProjectFilters, school: 'Saude' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('b')
  })

  it('ordena por orcamento crescente', () => {
    const state: ProjectFilterState = {
      ...emptyProjectFilters,
      sortKey: 'budget',
      sortDir: 'asc',
    }
    const result = applyProjectFilters(baseProjects, state)
    expect(result.map((p) => p.id)).toEqual(['b', 'a', 'c'])
  })

  it('ordena por orcamento decrescente', () => {
    const state: ProjectFilterState = {
      ...emptyProjectFilters,
      sortKey: 'budget',
      sortDir: 'desc',
    }
    const result = applyProjectFilters(baseProjects, state)
    expect(result.map((p) => p.id)).toEqual(['c', 'a', 'b'])
  })

  it('ordena por periodo (data) crescente', () => {
    const state: ProjectFilterState = {
      ...emptyProjectFilters,
      sortKey: 'time',
      sortDir: 'asc',
    }
    const result = applyProjectFilters(baseProjects, state)
    expect(result.map((p) => p.id)).toEqual(['c', 'a', 'b'])
  })

  it('ordena por periodo decrescente', () => {
    const state: ProjectFilterState = {
      ...emptyProjectFilters,
      sortKey: 'time',
      sortDir: 'desc',
    }
    const result = applyProjectFilters(baseProjects, state)
    expect(result.map((p) => p.id)).toEqual(['b', 'a', 'c'])
  })

  it('combina filtro de curso com ordenacao por orcamento desc', () => {
    const state: ProjectFilterState = {
      course: 'CC',
      school: null,
      sortKey: 'budget',
      sortDir: 'desc',
    }
    const result = applyProjectFilters(baseProjects, state)
    expect(result.map((p) => p.id)).toEqual(['c', 'a'])
  })

  it('nao muta o array original ao ordenar', () => {
    const original = [...baseProjects]
    const state: ProjectFilterState = {
      ...emptyProjectFilters,
      sortKey: 'budget',
      sortDir: 'asc',
    }
    applyProjectFilters(baseProjects, state)
    expect(baseProjects).toEqual(original)
  })

  it('lida com budget null tratando como 0', () => {
    const items: FakeProject[] = [
      { id: 'x', budget: null },
      { id: 'y', budget: 10 },
    ]
    const result = applyProjectFilters(items, {
      ...emptyProjectFilters,
      sortKey: 'budget',
      sortDir: 'asc',
    })
    expect(result.map((p) => p.id)).toEqual(['x', 'y'])
  })

  it('lida com period_start ausente sem quebrar', () => {
    const items: FakeProject[] = [{ id: 'x' }, { id: 'y', period_start: '2025-01-01' }]
    expect(() =>
      applyProjectFilters(items, { ...emptyProjectFilters, sortKey: 'time', sortDir: 'asc' }),
    ).not.toThrow()
  })
})
