import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card'

describe('Card', () => {
  it('renderiza children no Card', () => {
    render(<Card>Conteudo</Card>)
    expect(screen.getByText('Conteudo')).toBeInTheDocument()
  })

  it('CardHeader renderiza children', () => {
    render(<CardHeader>Header</CardHeader>)
    expect(screen.getByText('Header')).toBeInTheDocument()
  })

  it('CardTitle renderiza como h1', () => {
    render(<CardTitle>Titulo</CardTitle>)
    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveTextContent('Titulo')
  })

  it('CardDescription renderiza children', () => {
    render(<CardDescription>Descricao</CardDescription>)
    expect(screen.getByText('Descricao')).toBeInTheDocument()
  })

  it('CardContent renderiza children', () => {
    render(<CardContent>Corpo</CardContent>)
    expect(screen.getByText('Corpo')).toBeInTheDocument()
  })

  it('CardFooter renderiza children', () => {
    render(<CardFooter>Rodape</CardFooter>)
    expect(screen.getByText('Rodape')).toBeInTheDocument()
  })

  it('Card aceita className adicional', () => {
    render(<Card className="meu-extra">X</Card>)
    expect(screen.getByText('X').parentElement || screen.getByText('X')).toBeTruthy()
    const section = screen.getByText('X')
    expect(section).toHaveClass('meu-extra')
  })

  it('Card aplica largura responsiva base', () => {
    render(<Card>X</Card>)
    expect(screen.getByText('X')).toHaveClass('w-[min(460px,100%)]')
  })
})
