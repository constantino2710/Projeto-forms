import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseClassName =
      'inline-flex cursor-pointer items-center justify-center gap-1 rounded-[calc(var(--radius)-2px)] border border-transparent text-[0.925rem] leading-none font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'
    const variantClassName = {
      default:
        'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:not-disabled:bg-[hsl(var(--primary)/0.9)]',
      outline:
        'border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:not-disabled:bg-[hsl(var(--accent))] hover:not-disabled:text-[hsl(var(--accent-foreground))]',
      ghost:
        'bg-transparent text-[hsl(var(--foreground))] hover:not-disabled:bg-[hsl(var(--accent))] hover:not-disabled:text-[hsl(var(--accent-foreground))]',
      destructive:
        'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:not-disabled:bg-[hsl(var(--destructive)/0.9)]',
    }[variant]
    const sizeClassName = {
      sm: 'min-h-8 px-[0.65rem] py-[0.4rem]',
      default: 'min-h-11 px-4 py-[0.65rem]',
      lg: 'min-h-12 px-[1.1rem] py-[0.8rem]',
    }[size]

    return (
      <button
        ref={ref}
        className={cn(baseClassName, variantClassName, sizeClassName, className)}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
