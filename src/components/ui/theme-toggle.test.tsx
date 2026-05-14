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

  it('renderiza com "Tema escuro" quando inicia em light', () => {
    localStorage.setItem(THEME_KEY, 'light')
    render(<ThemeToggle />)
    expect(screen.getByText('Tema escuro')).toBeInTheDocument()
  })

  it('renderiza com "Tema claro" quando inicia em dark', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    render(<ThemeToggle />)
    expect(screen.getByText('Tema claro')).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('clicar troca de light para dark e adiciona classe .dark no html', async () => {
    localStorage.setItem(THEME_KEY, 'light')
    render(<ThemeToggle />)
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Tema claro')).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it('clicar duas vezes volta para light e remove classe', async () => {
    localStorage.setItem(THEME_KEY, 'light')
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    await userEvent.click(button)
    await userEvent.click(button)
    expect(screen.getByText('Tema escuro')).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
  })
})
