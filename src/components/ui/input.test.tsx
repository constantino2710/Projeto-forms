import { describe, expect, it, vi } from 'vitest'
import { createRef, useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './input'

function ControlledInput({ onValue }: { onValue?: (v: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <Input
      placeholder="Digite"
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
        onValue?.(event.target.value)
      }}
    />
  )
}

describe('Input', () => {
  it('renderiza com placeholder', () => {
    render(<Input placeholder="Seu nome" />)
    expect(screen.getByPlaceholderText('Seu nome')).toBeInTheDocument()
  })

  it('e controlado (value + onChange atualiza)', async () => {
    const onValue = vi.fn()
    render(<ControlledInput onValue={onValue} />)
    const input = screen.getByPlaceholderText('Digite') as HTMLInputElement
    await userEvent.type(input, 'abc')
    expect(input.value).toBe('abc')
    expect(onValue).toHaveBeenCalled()
  })

  it('repassa type="password"', () => {
    render(<Input type="password" placeholder="Senha" />)
    expect(screen.getByPlaceholderText('Senha')).toHaveAttribute('type', 'password')
  })

  it('repassa disabled', () => {
    render(<Input placeholder="Bloqueado" disabled />)
    expect(screen.getByPlaceholderText('Bloqueado')).toBeDisabled()
  })

  it('aceita className adicional sem perder o base', () => {
    render(<Input placeholder="Extra" className="meu-extra" />)
    const input = screen.getByPlaceholderText('Extra')
    expect(input).toHaveClass('meu-extra')
    expect(input).toHaveClass('w-full')
  })

  it('aceita foco programatico via ref', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} placeholder="Foco" />)
    ref.current?.focus()
    expect(document.activeElement).toBe(ref.current)
  })

  it('passa atributos HTML extras (maxLength, inputMode)', () => {
    render(<Input placeholder="Tel" maxLength={11} inputMode="numeric" />)
    const input = screen.getByPlaceholderText('Tel')
    expect(input).toHaveAttribute('maxLength', '11')
    expect(input).toHaveAttribute('inputMode', 'numeric')
  })
})
