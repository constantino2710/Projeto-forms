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

  return (
    <div className="filter-wrap" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={isActive ? 'active' : ''}
        onClick={() => setIsOpen((state) => !state)}
      >
        <Funnel size={14} />
        <span>Filtros{activeCount > 0 ? ` (${activeCount})` : ''}</span>
      </Button>

      {isOpen && (
        <div className="filter-popover filter-popover--stack">
          {hasStatusFilter && (
            <div className="filter-field">
              <span className="filter-label">Status</span>
              <div className="filter-tag-row">
                {statusOptions!.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={
                      selectedStatuses.includes(option.value)
                        ? 'filter-tag filter-tag-active'
                        : 'filter-tag'
                    }
                    onClick={() => toggleStatus(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="filter-field">
            <span className="filter-label">Curso</span>
            <select
              className="filter-select"
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

          <label className="filter-field">
            <span className="filter-label">Escola</span>
            <select
              className="filter-select"
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

          <label className="filter-field">
            <span className="filter-label">Ordenar por</span>
            <select
              className="filter-select"
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
            <button type="button" className="filter-clear" onClick={handleClear}>
              <X size={12} />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
