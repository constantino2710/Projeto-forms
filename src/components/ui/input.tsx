import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full min-h-11 rounded-[calc(var(--radius)-2px)] border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-[0.8rem] py-[0.65rem] text-[0.95rem] text-[hsl(var(--foreground))] transition-[border-color,box-shadow] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:shadow-[0_0_0_2px_hsl(var(--ring)/0.15)] focus:outline-none [&[type=date]::-webkit-calendar-picker-indicator]:opacity-100 [&[type=date]::-webkit-calendar-picker-indicator]:brightness-0 dark:[&[type=date]::-webkit-calendar-picker-indicator]:invert',
      className,
    )}
    {...props}
  />
))

Input.displayName = 'Input'
