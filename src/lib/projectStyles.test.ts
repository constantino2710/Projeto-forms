import { describe, expect, it } from 'vitest'
import {
  dashboardPanelClass,
  dashboardPanelFlatClass,
  projectCardClass,
  projectTwoCardsClass,
  statusColorMap,
} from './projectStyles'

describe('projectStyles', () => {
  it('dashboardPanelClass tem border e fundo de card', () => {
    expect(dashboardPanelClass).toContain('bg-card')
    expect(dashboardPanelClass).toContain('border-border')
  })

  it('dashboardPanelFlatClass remove a borda', () => {
    expect(dashboardPanelFlatClass).toContain('border-none')
    expect(dashboardPanelFlatClass).toContain('bg-card')
  })

  it('projectCardClass usa flex coluna com gap', () => {
    expect(projectCardClass).toContain('flex')
    expect(projectCardClass).toContain('flex-col')
    expect(projectCardClass).toContain('gap-1')
  })

  it('projectTwoCardsClass usa grid responsivo md', () => {
    expect(projectTwoCardsClass).toContain('grid')
    expect(projectTwoCardsClass).toContain('md:grid-cols-[minmax(0,1fr)_320px]')
  })

  describe('statusColorMap', () => {
    it('cobre todos os status conhecidos', () => {
      const expectedKeys = [
        'rascunho',
        'submetido',
        'em_avaliacao',
        'em_ajustes',
        'aprovado',
        'reprovado',
      ]
      for (const key of expectedKeys) {
        expect(statusColorMap[key]).toBeTypeOf('string')
        expect(statusColorMap[key].length).toBeGreaterThan(0)
      }
    })

    it('rascunho usa tons mutados', () => {
      expect(statusColorMap.rascunho).toContain('bg-muted')
    })

    it('reprovado usa cores de status rejected', () => {
      expect(statusColorMap.reprovado).toContain('bg-status-rejected-bg')
      expect(statusColorMap.reprovado).toContain('text-status-rejected-fg')
    })
  })
})
