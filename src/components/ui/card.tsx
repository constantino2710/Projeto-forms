import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        'w-full max-w-[min(460px,100%)] overflow-hidden rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-[0_12px_40px_hsl(var(--foreground)/0.08)]',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 px-6 pt-6 pb-2.5', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cn('m-0 text-2xl leading-[1.2]', className)} {...props} />
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('m-0 text-[hsl(var(--muted-foreground))]', className)} {...props} />
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pt-2 pb-6', className)} {...props} />
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 pb-6', className)} {...props} />
}
