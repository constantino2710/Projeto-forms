import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from './theme-toggle'
import { THEME_KEY } from '../../lib/theme'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('renderiza switch desligado quando inicia em light', () => {
    localStorage.setItem(THEME_KEY, 'light')
    render(<ThemeToggle />)
    const sw = screen.getByRole('switch')
    expect(sw).toHaveAttribute('aria-checked', 'false')
  })

  it('renderiza switch ligado quando inicia em dark', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    render(<ThemeToggle />)
    const sw = screen.getByRole('switch')
    expect(sw).toHaveAttribute('aria-checked', 'true')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('clicar troca de light para dark e adiciona classe .dark no html', async () => {
    localStorage.setItem(THEME_KEY, 'light')
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('switch'))
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it('clicar duas vezes volta para light e remove classe', async () => {
    localStorage.setItem(THEME_KEY, 'light')
    render(<ThemeToggle />)
    const sw = screen.getByRole('switch')
    await userEvent.click(sw)
    await userEvent.click(sw)
    expect(sw).toHaveAttribute('aria-checked', 'false')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
  })
})
