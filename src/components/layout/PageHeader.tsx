import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type PageHeaderProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between gap-4 mb-6 pb-5 border-b border-border max-md:flex-col max-md:items-start',
        className,
      )}
    >
      <div className="flex flex-col gap-1.5 min-w-0">
        <h1 className="m-0 text-[1.65rem] font-bold leading-tight text-foreground truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="m-0 text-muted-foreground text-[0.95rem]">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 max-md:w-full max-md:justify-end shrink-0">
          {actions}
        </div>
      )}
    </header>
  )
}
