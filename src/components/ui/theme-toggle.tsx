import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { applyTheme, resolveInitialTheme, THEME_KEY, type Theme } from '../../lib/theme'
import { cn } from '../../lib/utils'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const initial = resolveInitialTheme()
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem(THEME_KEY, nextTheme)
    applyTheme(nextTheme)
  }

  const isDark = theme === 'dark'
  const label = isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className={cn(
        'relative inline-flex h-7 w-[3.25rem] items-center rounded-full p-0.5 cursor-pointer',
        'border border-[hsl(var(--sidebar-link-border))]',
        'transition-colors duration-200 ease-in-out',
        isDark
          ? 'bg-[hsl(var(--primary)/0.45)]'
          : 'bg-[hsl(var(--muted))]',
      )}
    >
      <span
        className={cn(
          'grid place-items-center w-6 h-6 rounded-full bg-white shadow',
          'transition-transform duration-200 ease-in-out',
          isDark ? 'translate-x-[1.5rem]' : 'translate-x-0',
        )}
      >
        {isDark ? (
          <Moon size={14} className="text-slate-700" />
        ) : (
          <Sun size={14} className="text-amber-500" />
        )}
      </span>
    </button>
  )
}
