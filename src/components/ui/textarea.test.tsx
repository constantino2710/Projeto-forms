import { describe, expect, it } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from './textarea'

function ControlledTextarea() {
  const [value, setValue] = useState('')
  return (
    <Textarea
      placeholder="Comentario"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  )
}

describe('Textarea', () => {
  it('renderiza com placeholder', () => {
    render(<Textarea placeholder="Mensagem" />)
    expect(screen.getByPlaceholderText('Mensagem')).toBeInTheDocument()
  })

  it('e controlado (digitar atualiza value)', async () => {
    render(<ControlledTextarea />)
    const ta = screen.getByPlaceholderText('Comentario') as HTMLTextAreaElement
    await userEvent.type(ta, 'oi')
    expect(ta.value).toBe('oi')
  })

  it('repassa rows', () => {
    render(<Textarea placeholder="X" rows={5} />)
    expect(screen.getByPlaceholderText('X')).toHaveAttribute('rows', '5')
  })

  it('repassa disabled', () => {
    render(<Textarea placeholder="Bloq" disabled />)
    expect(screen.getByPlaceholderText('Bloq')).toBeDisabled()
  })

  it('aceita className adicional sem perder o base', () => {
    render(<Textarea placeholder="Extra" className="meu-extra" />)
    const ta = screen.getByPlaceholderText('Extra')
    expect(ta).toHaveClass('meu-extra')
    expect(ta).toHaveClass('w-full')
  })
})
