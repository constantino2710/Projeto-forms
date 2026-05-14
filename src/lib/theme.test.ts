import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_KEY, applyTheme, initializeTheme, resolveInitialTheme } from './theme'

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('applyTheme', () => {
    it('adiciona classe dark ao html para tema escuro', () => {
      applyTheme('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('remove classe dark do html para tema claro', () => {
      document.documentElement.classList.add('dark')
      applyTheme('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('resolveInitialTheme', () => {
    it('usa preferencia salva no localStorage quando valida', () => {
      localStorage.setItem(THEME_KEY, 'dark')
      expect(resolveInitialTheme()).toBe('dark')
    })

    it('usa preferencia salva light quando valida', () => {
      localStorage.setItem(THEME_KEY, 'light')
      expect(resolveInitialTheme()).toBe('light')
    })

    it('cai para preferencia do sistema (dark) quando nada esta salvo', () => {
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList)

      expect(resolveInitialTheme()).toBe('dark')
      expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    })

    it('cai para preferencia do sistema (light) quando nada esta salvo', () => {
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList)

      expect(resolveInitialTheme()).toBe('light')
      expect(localStorage.getItem(THEME_KEY)).toBe('light')
    })

    it('ignora valor invalido no localStorage e cai para sistema', () => {
      localStorage.setItem(THEME_KEY, 'banana')
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList)

      expect(resolveInitialTheme()).toBe('light')
    })
  })

  describe('initializeTheme', () => {
    it('aplica o tema resolvido', () => {
      localStorage.setItem(THEME_KEY, 'dark')
      initializeTheme()
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })
})
