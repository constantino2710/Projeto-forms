export const dashboardPanelClass =
  'bg-card border border-border rounded-[var(--radius)] p-5 [&_h1]:m-0 [&_h1]:text-[1.4rem] [&_p]:m-0 [&_p]:mt-2.5 [&_p]:text-muted-foreground'

export const dashboardPanelFlatClass =
  'bg-card border-none rounded-[var(--radius)] p-5 [&_h1]:m-0 [&_h1]:text-[1.4rem] [&_p]:m-0 [&_p]:mt-2.5 [&_p]:text-muted-foreground'

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

export const projectsListClass = 'mt-4 flex flex-col gap-3'

export const projectsGridClass = 'mt-4 grid grid-cols-1 md:grid-cols-2 gap-3'

export const errorTextClass = 'm-0 text-destructive font-semibold'

export const successTextClass = 'm-0 text-success-foreground font-semibold'

export const projectCardLinkClass =
  'no-underline text-inherit [&>section]:transition-[border-color,transform] [&>section]:duration-150 [&>section]:ease-in-out hover:[&>section]:border-primary hover:[&>section]:-translate-y-px'

export const projectCardClass =
  'border border-border rounded-[calc(var(--radius)-2px)] p-3.5 bg-background min-h-[170px] flex flex-col gap-2.5 [&_h2]:m-0 [&_h2]:text-base [&_p]:m-0 [&_p]:text-[0.88rem]'

export const projectCardTopClass =
  'flex items-center justify-between gap-2'

export const projectTitleWrapClass = 'flex flex-col gap-1'

export const projectCardMetaClass = 'text-muted-foreground font-semibold'

export const statusBadgeBaseClass =
  'rounded-full border border-border px-2 py-[3px] text-[0.72rem] font-bold inline-block'

export const statusColorMap: Record<string, string> = {
  rascunho: 'bg-muted text-muted-foreground',
  submetido: 'bg-[hsl(216_100%_96%)] text-[hsl(221_83%_48%)]',
  em_avaliacao: 'bg-[hsl(45_100%_93%)] text-[hsl(30_89%_38%)]',
  em_ajustes: 'bg-[hsl(24_100%_94%)] text-[hsl(20_83%_37%)]',
  aprovado: 'bg-[hsl(140_67%_92%)] text-[hsl(142_72%_29%)]',
  reprovado: 'bg-[hsl(0_93%_94%)] text-destructive',
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
  'border-none rounded-[calc(var(--radius)-2px)] bg-background p-3.5'

export const projectDetailClass = 'flex flex-col gap-3'

export const projectApprovalChipClass =
  'mt-3 border border-border rounded-[calc(var(--radius)-3px)] bg-muted/35 px-2.5 py-2'

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
  'flex flex-col gap-3 p-3.5 border border-border rounded-[calc(var(--radius)-3px)] bg-muted/25 [&_h3]:m-0 [&_h3]:text-base [&_h3]:text-foreground'

export const projectSectionsStackClass = 'flex flex-col gap-4'

export const projectDetailActionsClass = 'mt-3.5 flex gap-2.5'

export const projectDetailActionsSpreadClass =
  'mt-3.5 flex gap-2.5 justify-between items-center'

export const projectDetailActionsLeftClass = 'flex gap-2.5 items-center'

export const timelineSideCardClass =
  'border border-border rounded-[calc(var(--radius)-2px)] bg-background p-3 sticky top-4 max-md:static [&_h2]:m-0 [&_h2]:text-[0.98rem] [&_p]:m-0 [&_p]:mt-2 [&_p]:text-[0.84rem] [&_p]:text-muted-foreground [&_strong]:text-foreground'

export const timelineStatusBadgeClass = 'inline-flex mb-3'

export const timelineRowClass = 'text-muted-foreground'
export const timelineRowLatestClass = 'text-foreground! font-bold'
export const timelineRowFutureClass = 'opacity-[0.42]'

export const projectFeedbackNoteClass =
  'border border-border rounded-[calc(var(--radius)-3px)] bg-muted/35 p-2.5'

export const projectFormClass =
  'mt-4 flex flex-col gap-3'

export const projectInlineActionsClass = 'flex gap-2'

export const projectGrid2Class = 'grid grid-cols-1 md:grid-cols-2 gap-2.5'

export const projectGrid3Class = 'grid grid-cols-1 md:grid-cols-3 gap-2.5'

export const formValidationSummaryClass =
  'border border-destructive bg-[color-mix(in_oklab,hsl(var(--destructive))_10%,transparent)] rounded-[calc(var(--radius)-2px)] px-3.5 py-3 text-destructive text-[0.86rem] [&>ul]:m-0 [&>ul]:pl-[18px] [&>ul]:flex [&>ul]:flex-col [&>ul]:gap-0.5'

export const formValidationTitleClass = 'mt-0 mb-1.5 m-0 font-bold'

export const attachmentsPanelClass =
  'mt-5 border border-border rounded-[calc(var(--radius)-2px)] p-3 bg-background'

export const attachmentsHeaderClass =
  'flex items-center justify-between gap-2 max-md:flex-col max-md:items-stretch [&_h2]:m-0 [&_h2]:text-base'

export const attachmentsUploadClass =
  'm-0 [&_input]:min-h-[2.2rem] [&_input]:px-2.5 [&_input]:py-1.5'

export const attachmentsListClass =
  'mt-2.5 m-0 p-0 list-none flex flex-col gap-2'

export const attachmentItemClass =
  'border border-border rounded-[calc(var(--radius)-4px)] p-2.5 flex justify-between items-center gap-2.5 max-md:flex-col max-md:items-start'

export const attachmentNameClass = 'm-0 font-semibold text-foreground'

export const attachmentMetaClass =
  'mt-1 m-0 text-[0.8rem] text-muted-foreground'

export const attachmentActionsClass =
  'flex items-center gap-2 max-md:w-full max-md:justify-between'

export const attachmentLinkClass =
  'no-underline text-primary font-semibold text-[0.88rem] hover:underline'

export const draftDeleteIconBtnClass =
  'w-[2.3rem] h-[2.3rem] rounded-full border border-[hsl(var(--destructive)/0.55)] bg-[hsl(0_0%_0%)] text-destructive inline-flex items-center justify-center cursor-pointer transition-[transform,background-color,border-color] duration-150 ease-in-out hover:not-disabled:-translate-y-px hover:not-disabled:bg-[hsl(0_0%_8%)] hover:not-disabled:border-[hsl(var(--destructive)/0.7)] disabled:opacity-60 disabled:cursor-not-allowed'

export const confirmModalBackdropClass =
  'fixed inset-0 z-[70] bg-[hsl(0_0%_0%/0.7)] grid place-items-center p-4'

export const confirmModalClass =
  'w-[min(460px,100%)] border border-[hsl(0_0%_20%)] rounded-[var(--radius)] bg-[hsl(0_0%_0%)] text-[hsl(0_0%_96%)] shadow-[0_22px_64px_hsl(0_0%_0%/0.55)] p-[18px] [&_h2]:m-0 [&_h2]:text-[1.15rem] [&_h2]:text-[hsl(0_0%_98%)] [&>p]:mt-2.5 [&>p]:m-0 [&>p]:text-[hsl(0_0%_74%)]'

export const confirmModalActionsClass =
  'mt-4 flex justify-end gap-2'

export const statusTimelineInlineClass =
  'mt-1.5 px-3 py-2.5 border border-border rounded-[calc(var(--radius)-2px)] bg-background grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1.5 [&_p]:m-0 [&_p]:text-[0.83rem] [&_p]:text-muted-foreground [&_strong]:text-foreground'

export const timelinePanelClass =
  'mt-3.5 border border-border rounded-[calc(var(--radius)-2px)] bg-background p-3 [&>h2]:m-0 [&>h2]:text-base [&>ul]:mt-2.5 [&>ul]:m-0 [&>ul]:p-0 [&>ul]:list-none [&>ul]:flex [&>ul]:flex-col [&>ul]:gap-2 [&>ul>li]:m-0 [&>ul>li]:text-muted-foreground [&>ul>li]:text-[0.9rem] [&>ul_strong]:text-foreground'

