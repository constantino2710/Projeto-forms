import { describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  it('renderiza filho como texto', () => {
    render(<Button>Salvar</Button>)
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument()
  })

  it('aplica variant default (bg-primary)', () => {
    render(<Button>Acao</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')
  })

  it('aplica variant outline (border-input)', () => {
    render(<Button variant="outline">Acao</Button>)
    expect(screen.getByRole('button')).toHaveClass('border-input')
  })

  it('aplica variant ghost (bg-transparent)', () => {
    render(<Button variant="ghost">Acao</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-transparent')
  })

  it('aplica variant destructive (bg-destructive)', () => {
    render(<Button variant="destructive">Excluir</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })

  it('aplica size sm (min-h-8)', () => {
    render(<Button size="sm">Acao</Button>)
    expect(screen.getByRole('button')).toHaveClass('min-h-8')
  })

  it('aplica size lg (min-h-12)', () => {
    render(<Button size="lg">Acao</Button>)
    expect(screen.getByRole('button')).toHaveClass('min-h-12')
  })

  it('aplica size default (min-h-11)', () => {
    render(<Button>Acao</Button>)
    expect(screen.getByRole('button')).toHaveClass('min-h-11')
  })

  it('repassa disabled para o button', () => {
    render(<Button disabled>Acao</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('chama onClick ao clicar', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Salvar</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('nao chama onClick quando disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Salvar
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('aceita className adicional sem perder o base', () => {
    render(<Button className="meu-extra">Acao</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('meu-extra')
    expect(button).toHaveClass('inline-flex')
  })

  it('aceita type="submit"', () => {
    render(<Button type="submit">Enviar</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('expoe ref do elemento button', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Acao</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
