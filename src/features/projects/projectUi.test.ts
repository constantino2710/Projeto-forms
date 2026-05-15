import { describe, expect, it } from 'vitest'
import {
  projectTypeBadgeClassName,
  statusBadgeBaseClassName,
  statusBadgeByStatus,
  statusBadgeClassName,
  typeBadgeBaseClassName,
  typeBadgeByType,
} from './projectUi'

describe('statusBadgeClassName', () => {
  it('combina base + classe especifica do status', () => {
    const className = statusBadgeClassName('aprovado')
    expect(className).toContain(statusBadgeBaseClassName)
    expect(className).toContain(statusBadgeByStatus.aprovado)
  })

  it('cobre todos os status do mapa', () => {
    const statuses = [
      'rascunho',
      'submetido',
      'em_avaliacao',
      'em_ajustes',
      'aprovado',
      'reprovado',
    ] as const
    for (const status of statuses) {
      const className = statusBadgeClassName(status)
      expect(className.length).toBeGreaterThan(0)
      expect(className).toContain(statusBadgeByStatus[status])
    }
  })

  it('rascunho usa fundo mutado', () => {
    expect(statusBadgeByStatus.rascunho).toContain('bg-muted')
  })

  it('reprovado usa cores de status rejected', () => {
    expect(statusBadgeByStatus.reprovado).toContain('bg-status-rejected-bg')
    expect(statusBadgeByStatus.reprovado).toContain('text-status-rejected-fg')
  })
})

describe('projectTypeBadgeClassName', () => {
  it('combina base + classe especifica do tipo extensao', () => {
    const className = projectTypeBadgeClassName('extensao')
    expect(className).toContain(typeBadgeBaseClassName)
    expect(className).toContain(typeBadgeByType.extensao)
  })

  it('combina base + classe especifica do tipo disciplina', () => {
    const className = projectTypeBadgeClassName('disciplina')
    expect(className).toContain(typeBadgeByType.disciplina)
  })

  it('aplica uppercase e tracking ao base', () => {
    expect(typeBadgeBaseClassName).toContain('uppercase')
    expect(typeBadgeBaseClassName).toContain('tracking-[0.04em]')
  })
})
