export const dashboardPanelClass =
  'bg-card border-border rounded-[1.5rem] p-6 shadow-[0_8px_28px_hsl(var(--foreground)/0.08)] [&_h1]:m-0 [&_h1]:text-[1.4rem] [&_h1]:font-semibold [&_p]:m-0 [&_p]:mt-2.5 [&_p]:text-muted-foreground'

export const dashboardPanelFlatClass =
  'bg-card border-none rounded-[1.5rem] p-6 shadow-[0_8px_28px_hsl(var(--foreground)/0.08)] [&_h1]:m-0 [&_h1]:text-[1.4rem] [&_h1]:font-semibold [&_p]:m-0 [&_p]:mt-2.5 [&_p]:text-muted-foreground'

export const projectsHeaderClass =
  'flex items-start justify-between gap-3 max-md:flex-col'

export const viewToggleClass = 'flex gap-2'

export const activeToggleButtonClass =
  'border-primary! bg-primary! text-primary-foreground!'

export const projectsToolbarClass =
  'mt-3 flex items-center gap-2.5 max-md:flex-col max-md:items-stretch'

export const searchWrapClass =
  'relative flex-1 [&>svg]:absolute [&>svg]:left-2.5 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2 [&>svg]:text-muted-foreground [&>svg]:pointer-events-none [&_input]:pl-8'

export const dashboardNoteClass = 'mt-2 m-0 text-muted-foreground text-[0.9rem]'

export const projectsListClass = 'mt-4 flex flex-col gap-2'

export const projectsGridClass = 'mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2'

export const historyListClass = 'mt-4 flex flex-col gap-1.5'

export const historyCardLinkClass =
  'block no-underline text-inherit [&>section]:transition-[background-color,box-shadow] [&>section]:duration-150 [&>section]:ease-in-out hover:[&>section]:bg-muted/40 hover:[&>section]:shadow-[0_4px_14px_hsl(var(--foreground)/0.06)]'

export const historyCardClass =
  'rounded-[0.75rem] px-3 py-2 bg-card flex flex-wrap items-center gap-x-3 gap-y-1 shadow-[0_2px_8px_hsl(var(--foreground)/0.04)] [&_h2]:m-0 [&_h2]:text-[0.92rem] [&_h2]:font-semibold [&_h2]:truncate [&_h2]:min-w-0 [&_h2]:flex-1'

export const historyCardMetaClass =
  'text-muted-foreground text-[0.78rem] shrink-0 whitespace-nowrap'

export const errorTextClass = 'm-0 text-destructive font-semibold'

export const successTextClass = 'm-0 text-success-foreground font-semibold'

export const projectCardLinkClass =
  'block h-full no-underline text-inherit [&>section]:transition-[transform,box-shadow] [&>section]:duration-150 [&>section]:ease-in-out hover:[&>section]:-translate-y-0.5 hover:[&>section]:shadow-[0_10px_30px_hsl(var(--foreground)/0.08)]'

export const projectCardClass =
  'h-full rounded-[1rem] px-4 py-3 bg-card flex flex-col gap-1 shadow-[0_4px_14px_hsl(var(--foreground)/0.06)] [&_h2]:m-0 [&_h2]:text-[0.95rem] [&_h2]:font-semibold [&_h2]:line-clamp-2 [&_p]:m-0 [&_p]:text-[0.82rem]'

export const projectCardTopClass =
  'flex items-center justify-between gap-2'

export const projectTitleWrapClass = 'flex flex-col gap-1'

export const projectCardMetaClass = 'text-muted-foreground font-semibold'

export const statusBadgeBaseClass =
  'inline-flex items-center justify-center shrink-0 min-w-[6.25rem] rounded-full px-2.5 py-1 text-[0.72rem] font-bold text-center'

export const statusColorMap: Record<string, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  submetido: 'bg-muted text-muted-foreground',
  em_avaliacao: 'bg-status-adjust-bg text-status-adjust-fg',
  em_ajustes: 'bg-status-adjust-bg text-status-adjust-fg',
  aprovado: 'bg-status-approved-bg text-status-approved-fg',
  reprovado: 'bg-status-rejected-bg text-status-rejected-fg',
}

export const projectTypeBadgeBaseClass =
  'inline-flex items-center w-fit rounded-full border border-transparent px-2 py-[0.18rem] text-[0.62rem] font-extrabold tracking-[0.04em] uppercase'

export const projectTypeBadgeExtensaoClass =
  'border-status-submitted-border bg-status-submitted-bg text-status-submitted-fg'

export const projectTypeBadgeDisciplinaClass =
  'border-status-adjust-border bg-status-adjust-bg text-status-adjust-fg'

export const backLinkClass =
  'inline-flex items-center gap-1.5 no-underline text-muted-foreground mb-3 text-[0.9rem]'

export const projectTwoCardsClass =
  'grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start'

export const projectMainCardClass =
  'border-none rounded-[1.25rem] bg-card p-5 shadow-[0_4px_18px_hsl(var(--foreground)/0.06)]'

export const projectDetailClass = 'flex flex-col gap-3'

export const projectApprovalChipClass =
  'mt-3 rounded-[1rem] bg-muted/50 px-3 py-2.5'

export const projectApprovalLabelClass =
  'm-0 text-[0.72rem] text-muted-foreground uppercase tracking-[0.04em]'

export const projectApprovalValueClass =
  'mt-1 m-0 text-[0.95rem] text-foreground font-bold'

export const projectApprovalDateClass =
  'mt-1 m-0 text-[0.82rem] text-muted-foreground'

export const projectInfoGridClass =
  'grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2.5'

export const projectInfoItemClass = 'min-w-0'

export const projectInfoItemFullClass = 'md:col-span-2 min-w-0'

export const projectInfoLabelClass =
  'm-0 text-[0.74rem] text-muted-foreground uppercase tracking-[0.04em] font-bold'

export const projectInfoValueClass =
  'mt-1 m-0 text-[0.98rem] text-foreground break-words'

export const projectInfoSectionClass =
  'flex flex-col gap-3 p-4 rounded-[1.25rem] bg-card shadow-[0_4px_18px_hsl(var(--foreground)/0.06)] [&_h3]:m-0 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground'

export const projectSectionsStackClass = 'flex flex-col gap-4'

export const projectDetailActionsClass = 'mt-3.5 flex gap-2.5'

export const projectDetailActionsSpreadClass =
  'mt-3.5 flex gap-2.5 justify-between items-center'

export const projectDetailActionsLeftClass = 'flex gap-2.5 items-center'

export const timelineSideCardClass =
  'rounded-[1.25rem] bg-card p-4 sticky top-4 max-md:static shadow-[0_4px_18px_hsl(var(--foreground)/0.06)] [&_h2]:m-0 [&_h2]:text-[0.98rem] [&_h2]:font-semibold [&_p]:m-0 [&_p]:mt-2 [&_p]:text-[0.84rem] [&_p]:text-muted-foreground [&_strong]:text-foreground'

export const timelineStatusBadgeClass = 'inline-flex mb-3'

export const timelineRowClass = 'text-muted-foreground'
export const timelineRowLatestClass = 'text-foreground! font-bold'
export const timelineRowFutureClass = 'opacity-[0.42]'

export const projectFeedbackNoteClass =
  'rounded-[1rem] bg-muted/50 p-3'

export const projectFormClass =
  'mt-4 flex flex-col gap-3'

export const projectInlineActionsClass = 'flex gap-2'

export const projectGrid2Class = 'grid grid-cols-1 md:grid-cols-2 gap-2.5'

export const projectGrid3Class = 'grid grid-cols-1 md:grid-cols-3 gap-2.5'

export const formValidationSummaryClass =
  'border border-destructive bg-[color-mix(in_oklab,hsl(var(--destructive))_10%,transparent)] rounded-[calc(var(--radius)-2px)] px-3.5 py-3 text-destructive text-[0.86rem] [&>ul]:m-0 [&>ul]:pl-[18px] [&>ul]:flex [&>ul]:flex-col [&>ul]:gap-0.5'

export const formValidationTitleClass = 'mt-0 mb-1.5 m-0 font-bold'

export const attachmentsPanelClass =
  'mt-5 rounded-[1.25rem] p-4 bg-card shadow-[0_4px_18px_hsl(var(--foreground)/0.06)]'

export const attachmentsHeaderClass =
  'flex items-center justify-between gap-2 max-md:flex-col max-md:items-stretch [&_h2]:m-0 [&_h2]:text-base'

export const attachmentsUploadClass =
  'm-0 [&_input]:min-h-[2.2rem] [&_input]:px-2.5 [&_input]:py-1.5'

export const attachmentsListClass =
  'mt-2.5 m-0 p-0 list-none flex flex-col gap-2'

export const attachmentItemClass =
  'rounded-[0.875rem] bg-muted/40 p-3 flex justify-between items-center gap-2.5 max-md:flex-col max-md:items-start'

export const attachmentNameClass = 'm-0 font-semibold text-foreground'

export const attachmentMetaClass =
  'mt-1 m-0 text-[0.8rem] text-muted-foreground'

export const attachmentActionsClass =
  'flex items-center gap-2 max-md:w-full max-md:justify-between'

export const attachmentLinkClass =
  'no-underline text-primary font-semibold text-[0.88rem] hover:underline'

export const draftDeleteIconBtnClass =
  'w-[2.3rem] h-[2.3rem] rounded-full border border-[hsl(var(--destructive)/0.55)] bg-card text-destructive inline-flex items-center justify-center cursor-pointer transition-[transform,background-color,border-color] duration-150 ease-in-out hover:not-disabled:-translate-y-px hover:not-disabled:bg-muted hover:not-disabled:border-[hsl(var(--destructive)/0.7)] disabled:opacity-60 disabled:cursor-not-allowed'

export const confirmModalBackdropClass =
  'fixed inset-0 z-[70] bg-[hsl(var(--overlay)/0.7)] grid place-items-center p-4 animate-fade-in'

export const confirmModalClass =
  'w-[min(460px,100%)] rounded-[1.5rem] bg-card text-card-foreground shadow-[0_22px_64px_hsl(var(--overlay)/0.45)] p-6 animate-fade-in-scale [&_h2]:m-0 [&_h2]:text-[1.15rem] [&_h2]:font-semibold [&_h2]:text-foreground [&>p]:mt-2.5 [&>p]:m-0 [&>p]:text-muted-foreground'

export const confirmModalActionsClass =
  'mt-4 flex justify-end gap-2'

export const statusTimelineInlineClass =
  'mt-1.5 px-4 py-3 rounded-[1rem] bg-muted/40 grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1.5 [&_p]:m-0 [&_p]:text-[0.83rem] [&_p]:text-muted-foreground [&_strong]:text-foreground'

export const timelinePanelClass =
  'mt-3.5 rounded-[1.25rem] bg-card p-4 shadow-[0_4px_18px_hsl(var(--foreground)/0.06)] [&>h2]:m-0 [&>h2]:text-base [&>h2]:font-semibold [&>ul]:mt-2.5 [&>ul]:m-0 [&>ul]:p-0 [&>ul]:list-none [&>ul]:flex [&>ul]:flex-col [&>ul]:gap-2 [&>ul>li]:m-0 [&>ul>li]:text-muted-foreground [&>ul>li]:text-[0.9rem] [&>ul_strong]:text-foreground'

