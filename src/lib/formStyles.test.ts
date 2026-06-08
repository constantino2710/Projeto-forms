import { describe, expect, it } from 'vitest'
import {
  checkboxItemClass,
  formLabelClass,
  projectFormLabelClass,
  selectInputClass,
} from './formStyles'

describe('formStyles', () => {
  it('formLabelClass aplica layout vertical com tamanho 0.925rem', () => {
    expect(formLabelClass).toContain('flex')
    expect(formLabelClass).toContain('flex-col')
    expect(formLabelClass).toContain('text-[0.925rem]')
    expect(formLabelClass).toContain('font-semibold')
  })

  it('projectFormLabelClass tem asterisco obrigatorio via has-[:required]', () => {
    expect(projectFormLabelClass).toContain('has-[:required]:before:content-["*"]')
    expect(projectFormLabelClass).toContain('has-[:required]:before:text-destructive')
    expect(projectFormLabelClass).toContain('has-[:required]:before:absolute')
  })

  it('checkboxItemClass usa grid 18px + 1fr', () => {
    expect(checkboxItemClass).toContain('grid-cols-[18px_minmax(0,1fr)]')
    expect(checkboxItemClass).toContain('w-full')
  })

  it('selectInputClass aplica appearance-none e cursor-pointer', () => {
    expect(selectInputClass).toContain('appearance-none')
    expect(selectInputClass).toContain('cursor-pointer')
    expect(selectInputClass).toContain('focus:border-ring')
  })
})
