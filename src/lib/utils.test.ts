import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('junta strings com espaco', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('ignora valores falsy', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })

  it('retorna string vazia quando todos os valores sao falsy', () => {
    expect(cn(false, null, undefined)).toBe('')
  })

  it('preserva strings vazias filtradas como falsy', () => {
    expect(cn('foo', '', 'bar')).toBe('foo bar')
  })

  it('permite uso condicional simples', () => {
    const active = true
    expect(cn('base', active && 'active')).toBe('base active')
    expect(cn('base', !active && 'active')).toBe('base')
  })
})
