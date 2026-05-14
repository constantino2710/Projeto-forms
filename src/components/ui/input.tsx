import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full border border-input rounded-[calc(var(--radius)-2px)] bg-background text-foreground px-[0.8rem] py-[0.65rem] min-h-11 text-[0.95rem] transition-[border-color,box-shadow] duration-150 ease-in-out placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:shadow-[0_0_0_2px_hsl(var(--ring)/0.15)]',
      className,
    )}
    {...props}
  />
))

Input.displayName = 'Input'
