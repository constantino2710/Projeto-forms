import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectFiltersBar, type StatusOption } from './ProjectFiltersBar'
import { emptyProjectFilters } from '../../features/projects/projectFilters'

const courses = ['Ciencia da Computacao', 'Medicina']
const schools = ['TIC', 'Saude']
const statusOptions: StatusOption[] = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'submetido', label: 'Submetido' },
]

describe('ProjectFiltersBar', () => {
  it('renderiza botao Filtros fechado por padrao', () => {
    render(
      <ProjectFiltersBar
        value={emptyProjectFilters}
        onChange={vi.fn()}
        courses={courses}
        schools={schools}
      />,
    )
    expect(screen.getByRole('button', { name: /Filtros/ })).toBeInTheDocument()
    expect(screen.queryByText('Curso')).not.toBeInTheDocument()
  })

  it('mostra contador (N) quando ha filtros ativos', () => {
    render(
      <ProjectFiltersBar
        value={{ ...emptyProjectFilters, course: 'Ciencia da Computacao' }}
        onChange={vi.fn()}
        courses={courses}
        schools={schools}
      />,
    )
    expect(screen.getByRole('button', { name: /Filtros \(1\)/ })).toBeInTheDocument()
  })

  it('abre popover ao clicar no botao', async () => {
    render(
      <ProjectFiltersBar
        value={emptyProjectFilters}
        onChange={vi.fn()}
        courses={courses}
        schools={schools}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    expect(screen.getByText('Curso')).toBeInTheDocument()
    expect(screen.getByText('Escola')).toBeInTheDocument()
    expect(screen.getByText('Ordenar por')).toBeInTheDocument()
  })

  it('trocar curso chama onChange com o novo valor', async () => {
    const onChange = vi.fn()
    render(
      <ProjectFiltersBar
        value={emptyProjectFilters}
        onChange={onChange}
        courses={courses}
        schools={schools}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    const select = screen.getByRole('combobox', { name: /Curso/ })
    await userEvent.selectOptions(select, 'Medicina')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ course: 'Medicina' }),
    )
  })

  it('selecionar "Todos" no curso passa course: null', async () => {
    const onChange = vi.fn()
    render(
      <ProjectFiltersBar
        value={{ ...emptyProjectFilters, course: 'Medicina' }}
        onChange={onChange}
        courses={courses}
        schools={schools}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    const select = screen.getByRole('combobox', { name: /Curso/ })
    await userEvent.selectOptions(select, '')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ course: null }),
    )
  })

  it('mostra tags de status quando statusOptions e provido', async () => {
    render(
      <ProjectFiltersBar
        value={emptyProjectFilters}
        onChange={vi.fn()}
        courses={courses}
        schools={schools}
        statusOptions={statusOptions}
        selectedStatuses={[]}
        onStatusesChange={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    expect(screen.getByRole('button', { name: 'Rascunho' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submetido' })).toBeInTheDocument()
  })

  it('clicar em status nao selecionado chama onStatusesChange adicionando', async () => {
    const onStatusesChange = vi.fn()
    render(
      <ProjectFiltersBar
        value={emptyProjectFilters}
        onChange={vi.fn()}
        courses={courses}
        schools={schools}
        statusOptions={statusOptions}
        selectedStatuses={[]}
        onStatusesChange={onStatusesChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Rascunho' }))
    expect(onStatusesChange).toHaveBeenCalledWith(['rascunho'])
  })

  it('clicar em status ja selecionado remove do array', async () => {
    const onStatusesChange = vi.fn()
    render(
      <ProjectFiltersBar
        value={emptyProjectFilters}
        onChange={vi.fn()}
        courses={courses}
        schools={schools}
        statusOptions={statusOptions}
        selectedStatuses={['rascunho', 'submetido']}
        onStatusesChange={onStatusesChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Rascunho' }))
    expect(onStatusesChange).toHaveBeenCalledWith(['submetido'])
  })

  it('botao "Limpar filtros" so aparece quando ha filtros ativos', async () => {
    const { rerender } = render(
      <ProjectFiltersBar
        value={emptyProjectFilters}
        onChange={vi.fn()}
        courses={courses}
        schools={schools}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    expect(screen.queryByText('Limpar filtros')).not.toBeInTheDocument()

    rerender(
      <ProjectFiltersBar
        value={{ ...emptyProjectFilters, course: 'Medicina' }}
        onChange={vi.fn()}
        courses={courses}
        schools={schools}
      />,
    )
    expect(screen.getByText('Limpar filtros')).toBeInTheDocument()
  })

  it('"Limpar filtros" zera onChange e onStatusesChange', async () => {
    const onChange = vi.fn()
    const onStatusesChange = vi.fn()
    render(
      <ProjectFiltersBar
        value={{ ...emptyProjectFilters, course: 'Medicina' }}
        onChange={onChange}
        courses={courses}
        schools={schools}
        statusOptions={statusOptions}
        selectedStatuses={['rascunho']}
        onStatusesChange={onStatusesChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    await userEvent.click(screen.getByText('Limpar filtros'))
    expect(onChange).toHaveBeenCalledWith(emptyProjectFilters)
    expect(onStatusesChange).toHaveBeenCalledWith([])
  })

  it('trocar ordenacao chama onChange com sortKey e sortDir corretos', async () => {
    const onChange = vi.fn()
    render(
      <ProjectFiltersBar
        value={emptyProjectFilters}
        onChange={onChange}
        courses={courses}
        schools={schools}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    const select = screen.getByRole('combobox', { name: /Ordenar por/ })
    await userEvent.selectOptions(select, 'budget-desc')
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sortKey: 'budget', sortDir: 'desc' }),
    )
  })

  it('click fora fecha o popover', async () => {
    render(
      <div>
        <button>fora</button>
        <ProjectFiltersBar
          value={emptyProjectFilters}
          onChange={vi.fn()}
          courses={courses}
          schools={schools}
        />
      </div>,
    )
    await userEvent.click(screen.getByRole('button', { name: /Filtros/ }))
    expect(screen.getByText('Curso')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'fora' }))
    expect(screen.queryByText('Curso')).not.toBeInTheDocument()
  })
})
