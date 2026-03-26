import { cn } from '../../lib/utils'
import type { AdminProjectStatus } from './adminProjects'

export const panelClassName =
  'rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5'
export const panelFlatClassName = 'border-none'
export const noteClassName = 'mt-2 text-[0.9rem] text-[hsl(var(--muted-foreground))]'
export const errorClassName = 'm-0 font-semibold text-[hsl(var(--destructive))]'
export const successClassName = 'm-0 font-semibold text-[hsl(var(--success-foreground))]'
export const backLinkClassName =
  'mb-3 inline-flex items-center gap-1.5 text-[0.9rem] text-[hsl(var(--muted-foreground))] no-underline'

export const projectsHeaderClassName =
  'flex flex-col items-start justify-between gap-3 md:flex-row md:items-start'
export const viewToggleClassName = 'flex gap-2'
export const viewToggleActiveClassName =
  'border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary)/0.92)] hover:text-[hsl(var(--primary-foreground))]'

export const projectsListClassName = 'mt-4 flex flex-col gap-3'
export const projectsGridClassName = 'grid grid-cols-1 gap-3 md:grid-cols-2'
export const projectCardLinkClassName = 'text-inherit no-underline'
export const projectCardClassName =
  'min-h-[170px] rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3.5 transition-[border-color,transform] hover:-translate-y-px hover:border-[hsl(var(--primary))]'
export const projectCardTopClassName = 'flex items-center justify-between gap-2'
export const projectTitleWrapClassName = 'flex flex-col gap-1'
export const projectTitleClassName = 'm-0 text-base'
export const projectCardMetaClassName = 'm-0 text-[0.88rem] font-semibold text-[hsl(var(--muted-foreground))]'

export const statusBadgeBaseClassName =
  'rounded-full border border-[hsl(var(--border))] px-2 py-[3px] text-[0.72rem] font-bold'

export const statusBadgeByStatus: Record<AdminProjectStatus, string> = {
  rascunho: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
  submetido: 'bg-[hsl(216_100%_96%)] text-[hsl(221_83%_48%)]',
  em_avaliacao: 'bg-[hsl(45_100%_93%)] text-[hsl(30_89%_38%)]',
  em_ajustes: 'bg-[hsl(24_100%_94%)] text-[hsl(20_83%_37%)]',
  aprovado: 'bg-[hsl(140_67%_92%)] text-[hsl(142_72%_29%)]',
  reprovado: 'bg-[hsl(0_93%_94%)] text-[hsl(var(--destructive))]',
}

export const typeBadgeBaseClassName =
  'inline-flex w-fit items-center rounded-full border border-transparent px-2 py-[0.18rem] text-[0.62rem] font-extrabold tracking-[0.04em] uppercase'
export const typeBadgeByType: Record<'extensao' | 'disciplina', string> = {
  extensao:
    'border-[hsl(var(--status-submitted-border))] bg-[hsl(var(--status-submitted-bg))] text-[hsl(var(--status-submitted-fg))]',
  disciplina:
    'border-[hsl(var(--status-adjust-border))] bg-[hsl(var(--status-adjust-bg))] text-[hsl(var(--status-adjust-fg))]',
}

export function statusBadgeClassName(status: AdminProjectStatus) {
  return cn(statusBadgeBaseClassName, statusBadgeByStatus[status])
}

export function projectTypeBadgeClassName(type: 'extensao' | 'disciplina') {
  return cn(typeBadgeBaseClassName, typeBadgeByType[type])
}
