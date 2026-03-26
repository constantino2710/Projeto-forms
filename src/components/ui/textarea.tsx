import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[110px] w-full resize-y rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-[0.8rem] py-[0.65rem] text-[0.95rem] text-[hsl(var(--foreground))] transition-[border-color,box-shadow] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:shadow-[0_0_0_2px_hsl(var(--ring)/0.15)] focus:outline-none',
        className,
      )}
      {...props}
    />
  ),
)

Textarea.displayName = 'Textarea'
