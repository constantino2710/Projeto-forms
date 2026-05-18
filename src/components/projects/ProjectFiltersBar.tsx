import { Funnel, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../ui/button'
import {
  emptyProjectFilters,
  findSortOption,
  isProjectFilterActive,
  sortOptions,
  type ProjectFilterState,
  type ProjectSortDir,
  type ProjectSortKey,
} from '../../features/projects/projectFilters'
import { cn } from '../../lib/utils'

export type StatusOption = {
  value: string
  label: string
}

type ProjectFiltersBarProps = {
  value: ProjectFilterState
  onChange: (next: ProjectFilterState) => void
  courses: string[]
  schools: string[]
  statusOptions?: StatusOption[]
  selectedStatuses?: string[]
  onStatusesChange?: (next: string[]) => void
}

const activeButtonClass = 'border-primary! bg-primary! text-primary-foreground!'

export function ProjectFiltersBar({
  value,
  onChange,
  courses,
  schools,
  statusOptions,
  selectedStatuses = [],
  onStatusesChange,
}: ProjectFiltersBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const hasStatusFilter = !!statusOptions && !!onStatusesChange
  const isActive =
    isProjectFilterActive(value) || (hasStatusFilter && selectedStatuses.length > 0)
  const currentSort = findSortOption(value.sortKey, value.sortDir)
  const activeCount =
    (value.course ? 1 : 0) +
    (value.school ? 1 : 0) +
    (value.sortKey ? 1 : 0) +
    (hasStatusFilter ? selectedStatuses.length : 0)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleCourse = (next: string) => {
    onChange({ ...value, course: next === '' ? null : next })
  }

  const handleSchool = (next: string) => {
    onChange({ ...value, school: next === '' ? null : next })
  }

  const handleSort = (next: string) => {
    const option = sortOptions.find((item) => item.value === next) ?? sortOptions[0]
    onChange({
      ...value,
      sortKey: option.sortKey as ProjectSortKey | null,
      sortDir: option.sortDir as ProjectSortDir | null,
    })
  }

  const toggleStatus = (status: string) => {
    if (!onStatusesChange) return
    onStatusesChange(
      selectedStatuses.includes(status)
        ? selectedStatuses.filter((item) => item !== status)
        : [...selectedStatuses, status],
    )
  }

  const handleClear = () => {
    onChange(emptyProjectFilters)
    if (onStatusesChange) onStatusesChange([])
  }

  const selectClass =
    'w-full px-3 py-1.5 text-[0.85rem] font-medium rounded-xl border border-border bg-card text-foreground cursor-pointer focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]'

  return (
    <div className="relative flex-[0_0_auto] ml-auto" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={isActive ? activeButtonClass : ''}
        onClick={() => setIsOpen((state) => !state)}
      >
        <Funnel size={14} />
        <span>Filtros{activeCount > 0 ? ` (${activeCount})` : ''}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] min-w-[240px] rounded-[1.25rem] bg-card p-4 flex flex-col items-stretch gap-2.5 z-40 shadow-[0_18px_48px_hsl(var(--foreground)/0.14)] origin-top animate-slide-down-fade">
          {hasStatusFilter && (
            <div className="flex flex-col gap-1 text-[0.78rem] font-semibold text-muted-foreground">
              <span className="uppercase tracking-[0.04em]">Status</span>
              <div className="flex flex-wrap gap-1.5">
                {statusOptions!.map((option) => {
                  const isSelected = selectedStatuses.includes(option.value)
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        'rounded-full px-3 py-1 text-[0.78rem] font-medium cursor-pointer transition-colors',
                        isSelected
                          ? 'border border-primary bg-primary text-primary-foreground'
                          : 'border border-border bg-card text-foreground hover:border-primary/40',
                      )}
                      onClick={() => toggleStatus(option.value)}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <label className="flex flex-col gap-1 text-[0.78rem] font-semibold text-muted-foreground">
            <span className="uppercase tracking-[0.04em]">Curso</span>
            <select
              className={selectClass}
              value={value.course ?? ''}
              onChange={(event) => handleCourse(event.target.value)}
            >
              <option value="">Todos</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[0.78rem] font-semibold text-muted-foreground">
            <span className="uppercase tracking-[0.04em]">Escola</span>
            <select
              className={selectClass}
              value={value.school ?? ''}
              onChange={(event) => handleSchool(event.target.value)}
            >
              <option value="">Todas</option>
              {schools.map((school) => (
                <option key={school} value={school}>
                  {school}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[0.78rem] font-semibold text-muted-foreground">
            <span className="uppercase tracking-[0.04em]">Ordenar por</span>
            <select
              className={selectClass}
              value={currentSort.value}
              onChange={(event) => handleSort(event.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {isActive && (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1 self-end px-3 py-1.5 text-[0.78rem] font-medium text-muted-foreground bg-transparent rounded-full cursor-pointer hover:text-foreground hover:bg-muted/60"
              onClick={handleClear}
            >
              <X size={12} />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
