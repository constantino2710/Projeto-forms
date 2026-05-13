export type ProjectSortKey = 'budget' | 'time'
export type ProjectSortDir = 'asc' | 'desc'

export type ProjectFilterState = {
  course: string | null
  school: string | null
  sortKey: ProjectSortKey | null
  sortDir: ProjectSortDir | null
}

export const emptyProjectFilters: ProjectFilterState = {
  course: null,
  school: null,
  sortKey: null,
  sortDir: null,
}

export const isProjectFilterActive = (state: ProjectFilterState): boolean =>
  state.course !== null || state.school !== null || state.sortKey !== null

export type SortOption = {
  value: string
  label: string
  sortKey: ProjectSortKey | null
  sortDir: ProjectSortDir | null
}

export const sortOptions: SortOption[] = [
  { value: 'default', label: 'Padrao (mais recentes)', sortKey: null, sortDir: null },
  { value: 'time-asc', label: 'Periodo: do mais antigo', sortKey: 'time', sortDir: 'asc' },
  { value: 'time-desc', label: 'Periodo: do mais recente', sortKey: 'time', sortDir: 'desc' },
  { value: 'budget-asc', label: 'Orcamento: do menor', sortKey: 'budget', sortDir: 'asc' },
  { value: 'budget-desc', label: 'Orcamento: do maior', sortKey: 'budget', sortDir: 'desc' },
]

export const findSortOption = (
  sortKey: ProjectSortKey | null,
  sortDir: ProjectSortDir | null,
): SortOption => {
  return (
    sortOptions.find((option) => option.sortKey === sortKey && option.sortDir === sortDir) ??
    sortOptions[0]
  )
}

type FilterableProject = {
  course?: string | null
  school?: string | null
  budget?: number | string | null
  period_start?: string | null
}

export const applyProjectFilters = <T extends FilterableProject>(
  items: T[],
  state: ProjectFilterState,
): T[] => {
  let result = items

  if (state.course) {
    result = result.filter((item) => item.course === state.course)
  }
  if (state.school) {
    result = result.filter((item) => item.school === state.school)
  }

  if (state.sortKey) {
    const direction = state.sortDir === 'asc' ? 1 : -1
    result = [...result].sort((a, b) => {
      if (state.sortKey === 'budget') {
        return (Number(a.budget ?? 0) - Number(b.budget ?? 0)) * direction
      }
      return (a.period_start ?? '').localeCompare(b.period_start ?? '') * direction
    })
  }

  return result
}
