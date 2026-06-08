import { cn } from '../../lib/utils'
import type { AdminProjectStatus } from './adminProjects'

export const panelClassName =
  'rounded-[1.5rem] bg-[hsl(var(--card))] p-6 shadow-[0_8px_28px_hsl(var(--foreground)/0.08)]'
export const panelFlatClassName = 'shadow-none'
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
  'min-h-[170px] rounded-[1.25rem] bg-[hsl(var(--card))] p-5 shadow-[0_6px_20px_hsl(var(--foreground)/0.07)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_hsl(var(--foreground)/0.08)]'
export const projectCardTopClassName = 'flex items-center justify-between gap-2'
export const projectTitleWrapClassName = 'flex flex-col gap-1'
export const projectTitleClassName = 'm-0 text-base'
export const projectCardMetaClassName = 'm-0 text-[0.88rem] font-semibold text-[hsl(var(--muted-foreground))]'

export const statusBadgeBaseClassName =
  'rounded-full px-2.5 py-1 text-[0.72rem] font-bold'

export const statusBadgeByStatus: Record<AdminProjectStatus, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  submetido: 'bg-status-submitted-bg text-status-submitted-fg',
  em_avaliacao: 'bg-status-review-bg text-status-review-fg',
  em_ajustes: 'bg-status-adjust-bg text-status-adjust-fg',
  pre_aprovado: 'bg-status-approved-bg/60 text-status-approved-fg',
  pre_reprovado: 'bg-status-rejected-bg/60 text-status-rejected-fg',
  aprovado: 'bg-status-approved-bg text-status-approved-fg',
  reprovado: 'bg-status-rejected-bg text-status-rejected-fg',
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
