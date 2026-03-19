export const THEME_KEY = 'extensao_theme'

export type Theme = 'light' | 'dark'

export const resolveInitialTheme = (): Theme => {
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  const fallback = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  localStorage.setItem(THEME_KEY, fallback)
  return fallback
}

export const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const initializeTheme = () => {
  applyTheme(resolveInitialTheme())
}
