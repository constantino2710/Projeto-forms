import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from './button'
import { applyTheme, resolveInitialTheme, THEME_KEY, type Theme } from '../../lib/theme'

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

  return (
    <Button type="button" variant="outline" size="sm" onClick={toggleTheme}>
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
    </Button>
  )
}
