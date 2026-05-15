import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full border border-input rounded-2xl bg-card text-foreground px-4 py-3 text-[0.95rem] resize-none h-[110px] overflow-y-auto transition-[border-color,box-shadow] duration-150 ease-in-out placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:shadow-[0_0_0_3px_hsl(var(--ring)/0.12)]',
        className,
      )}
      {...props}
    />
  ),
)

Textarea.displayName = 'Textarea'
