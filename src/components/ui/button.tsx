import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const base =
  'inline-flex items-center justify-center gap-[0.4rem] rounded-[calc(var(--radius)-2px)] border border-transparent text-[0.925rem] font-semibold leading-none cursor-pointer transition-[background-color,border-color,color] duration-150 ease-in-out disabled:cursor-not-allowed disabled:opacity-60'

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:not-disabled:bg-primary/90',
  outline:
    'border-input bg-background text-foreground hover:not-disabled:bg-accent hover:not-disabled:text-accent-foreground',
  ghost: 'bg-transparent text-foreground hover:not-disabled:bg-accent hover:not-disabled:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:not-disabled:bg-destructive/90',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-8 px-[0.65rem] py-[0.4rem]',
  default: 'min-h-11 px-4 py-[0.65rem]',
  lg: 'min-h-12 px-[1.1rem] py-[0.8rem]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  ),
)

Button.displayName = 'Button'
