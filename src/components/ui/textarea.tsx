import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full border border-input rounded-[calc(var(--radius)-2px)] bg-background text-foreground px-[0.8rem] py-[0.65rem] text-[0.95rem] resize-none h-[110px] overflow-y-auto transition-[border-color,box-shadow] duration-150 ease-in-out placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:shadow-[0_0_0_2px_hsl(var(--ring)/0.15)]',
        className,
      )}
      {...props}
    />
  ),
)

Textarea.displayName = 'Textarea'
